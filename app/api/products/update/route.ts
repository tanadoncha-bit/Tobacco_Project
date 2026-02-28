import { authOptions } from "@/utils/authOptions";
import prisma from "@/utils/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    const { Pid, name, images = [], variants = [], options = [] } = await req.json();

    const session = await getServerSession(authOptions);
    const profileId = session?.user?.id;

    if (!Pid || !name) return NextResponse.json({ message: "Invalid payload" }, { status: 400 });

    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { Pid }, data: { Pname: name } });

      await tx.productImage.deleteMany({ where: { Pid } });
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((url: string) => ({ Pid, url })),
        });
      }

      const valueIdMap = new Map<string, number>();
      await tx.productOption.deleteMany({ where: { Pid } });
      
      for (const opt of options) {
        const createdOption = await tx.productOption.create({
          data: { name: opt.name, Pid },
        });

        for (const val of opt.values ?? []) {
          const createdValue = await tx.productOptionValue.create({
            data: { value: val.value, optionId: createdOption.id },
          });
          valueIdMap.set(val.value, createdValue.id);
        }
      }

      const incomingVariantIds = variants.map((v: any) => v.id).filter(Boolean);
      await tx.productVariant.deleteMany({
        where: { 
          Pid, 
          id: { notIn: incomingVariantIds.length > 0 ? incomingVariantIds : [0] } 
        }
      });

      for (const v of variants) {
        let currentVariant;
        if (v.id) {
          currentVariant = await tx.productVariant.update({
            where: { id: v.id },
            data: { price: Number(v.price), stock: Number(v.stock) },
          });
          await tx.productVariantValue.deleteMany({ where: { variantId: v.id } });
        } else {
          currentVariant = await tx.productVariant.create({
            data: { Pid, price: Number(v.price), stock: Number(v.stock) },
          });
        }

        for (const val of v.values ?? []) {
          const valueString = val?.optionValue?.value || val?.value;
          const optionValueId = valueIdMap.get(valueString);
          if (optionValueId) {
            await tx.productVariantValue.create({
              data: { variantId: currentVariant.id, optionValueId },
            });
          }
        }
      }

      await tx.productSlip.create({
        data: {
          Pid,
          action: "UPDATE",
          snapshot: { name, images, variants },
          profileId: profileId || null,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("UPDATE PRODUCT ERROR:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}