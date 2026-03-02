import { NextResponse } from "next/server"
import prisma from "@/utils/db"

export async function GET() {
    try {
        const now = new Date()

        // 1. ดึง Lot สินค้าที่หมดอายุ
        const expiredProductLots = await prisma.productVariantLot.findMany({
            where: {
                expireDate: { lt: now },
                stock: { gt: 0 } 
            },
            include: {
                variant: {
                    include: {
                        product: true // ใน schema ของคุณ Product ใช้ฟิลด์ Pname
                    }
                }
            }
        })

        // 2. ดึง Lot วัตถุดิบที่หมดอายุ
        const expiredMaterialLots = await prisma.materialLot.findMany({
            where: {
                expireDate: { lt: now },
                stock: { gt: 0 }
            },
            include: {
                material: true // ใน schema ของคุณ Material ใช้ฟิลด์ name
            }
        })

        // 3. ปรับ Format ให้หน้าบ้าน (Frontend) ใช้งานง่ายและเหมือนกัน
        const products = expiredProductLots.map(item => ({
            id: `PROD-${item.id}`,
            dbId: item.id, // ID จริงใน DB
            type: "PRODUCT",
            name: item.variant?.product?.Pname || "ไม่ทราบชื่อสินค้า",
            lotNumber: item.lotNumber,
            stock: item.stock,
            unit: "ชิ้น",
            expireDate: item.expireDate,
            unitCost: item.unitCost || 0,
            category: "สินค้าสำเร็จรูป"
        }))

        const materials = expiredMaterialLots.map(item => ({
            id: `MAT-${item.id}`,
            dbId: item.id,
            type: "MATERIAL",
            name: item.material?.name || "ไม่ทราบชื่อวัตถุดิบ",
            lotNumber: item.lotNumber,
            stock: item.stock,
            unit: item.material?.unit || "หน่วย",
            expireDate: item.expireDate,
            unitCost: item.costPerUnit || 0, // ใน MaterialLot คุณใช้ costPerUnit
            category: "วัตถุดิบ"
        }))

        return NextResponse.json({ 
            success: true, 
            data: [...products, ...materials] // รวมร่างกันส่งไป
        })

    } catch (error) {
        console.error("GET_EXPIRED_ERROR:", error)
        return NextResponse.json({ success: false, error: "ดึงข้อมูลล้มเหลว" }, { status: 500 })
    }
}