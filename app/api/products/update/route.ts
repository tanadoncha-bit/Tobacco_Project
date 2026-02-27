import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export async function PUT(req: Request) {
  try {
    const { Pid, name, images = [], variants = [], options = [] } = await req.json()

    if (!Pid || !name) return NextResponse.json({ message: "Invalid payload" }, { status: 400 })

    await prisma.$transaction(async (tx) => {
      // 1️⃣ อัปเดตชื่อสินค้า
      await tx.product.update({ where: { Pid }, data: { Pname: name } })

      // 2️⃣ อัปเดตรูปภาพ (อันนี้ลบสร้างใหม่ได้เพราะไม่กระทบตะกร้า)
      await tx.productImage.deleteMany({ where: { Pid } })
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((url: string) => ({ Pid, url })),
        })
      }

      // 3️⃣ จัดการ Option & Values อย่างปลอดภัย
      const valueIdMap = new Map<string, number>()
      
      // ลบ Option เดิมทิ้งแล้วสร้างใหม่ (สำหรับ Option ไม่มีผลกับตะกร้ามากนัก)
      await tx.productOption.deleteMany({ where: { Pid } })
      
      for (const opt of options) {
        const createdOption = await tx.productOption.create({
          data: { name: opt.name, Pid },
        })

        for (const val of opt.values ?? []) {
          const createdValue = await tx.productOptionValue.create({
            data: { value: val.value, optionId: createdOption.id },
          })
          valueIdMap.set(val.value, createdValue.id)
        }
      }

      // 4️⃣ จัดการ Variants (สำคัญมาก! ห้ามลบทิ้งมั่วซั่ว)
      // ดึง ID ของ variant เก่าๆ ทั้งหมดที่ส่งมาจากหน้าบ้าน
      const incomingVariantIds = variants.map((v: any) => v.id).filter(Boolean)

      // ลบเฉพาะ Variant ที่ถูกแอดมินลบออกจริงๆ (ID ไม่ได้ส่งกลับมา)
      await tx.productVariant.deleteMany({
        where: { 
          Pid, 
          id: { notIn: incomingVariantIds.length > 0 ? incomingVariantIds : [0] } 
        }
      })

      // อัปเดตหรือสร้าง Variant ทีละตัว
      for (const v of variants) {
        let currentVariant;

        if (v.id) {
          // ถ้ามี ID เดิม -> ให้อัปเดต ราคา/สต๊อก (ป้องกันตะกร้าลูกค้าพัง)
          currentVariant = await tx.productVariant.update({
            where: { id: v.id },
            data: { price: Number(v.price), stock: Number(v.stock) },
          })
          // ลบ VariantValue เก่าเพื่อผูกใหม่
          await tx.productVariantValue.deleteMany({ where: { variantId: v.id } })
        } else {
          // ถ้าเป็นตัวเลือกใหม่เอี่ยม -> สร้างใหม่
          currentVariant = await tx.productVariant.create({
            data: { Pid, price: Number(v.price), stock: Number(v.stock) },
          })
        }

        // ผูกความสัมพันธ์เข้ากับ OptionValue ใหม่
        for (const val of v.values ?? []) {
          const valueString = val?.optionValue?.value
          const optionValueId = valueIdMap.get(valueString)
          if (optionValueId) {
            await tx.productVariantValue.create({
              data: { variantId: currentVariant.id, optionValueId },
            })
          }
        }
      }

      // 5️⃣ สร้าง Slip ประวัติการอัปเดต (เก็บ Snapshot)
      await tx.productSlip.create({
        data: {
          Pid,
          action: "UPDATE",
          snapshot: { name, images, variants },
          createdBy: "Product Staff",
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("UPDATE PRODUCT ERROR:", err)
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}