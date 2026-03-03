import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions";

const prisma = new PrismaClient();

const REASON_TEXT: Record<string, string> = {
  "NEW_PURCHASE": "รับเข้าสินค้าใหม่",
  "PRODUCTION": "รับเข้าจากการผลิต",
  "RETURN": "ลูกค้านำสินค้ามาคืน",
  "AUDIT": "ปรับยอดสต๊อก (นับเกิน)",
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized - กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const body = await req.json();

    // ✅ เพิ่ม unitCost ตรงนี้
    const { variantId, amount, type, reason, note, lotNumber, expireDate, unitCost } = body;

    if (!variantId || !amount || !type || !reason) {
      return NextResponse.json(
        { message: "ข้อมูลไม่ครบถ้วน (กรุณาระบุสาเหตุให้ครบ)" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let currentLotId: number | null = null;
      let lotNumberForNote = "";

      if (type === "IN" && (reason === "NEW_PURCHASE" || reason === "PRODUCTION")) {
        const currentLotNumber = lotNumber || `LOT-${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}`;
        lotNumberForNote = currentLotNumber;

        const existingLot = await tx.productVariantLot.findUnique({
          where: {
            variantId_lotNumber: {
              variantId: Number(variantId),
              lotNumber: currentLotNumber
            }
          }
        });

        if (existingLot) {
          const updatedLot = await tx.productVariantLot.update({
            where: { id: existingLot.id },
            data: { stock: { increment: Number(amount) } }
          });
          currentLotId = updatedLot.id;
        } else {
          const newLot = await tx.productVariantLot.create({
            data: {
              variantId: Number(variantId),
              lotNumber: currentLotNumber,
              stock: Number(amount),
              expireDate: expireDate ? new Date(expireDate) : null,
              produceDate: new Date(),
              unitCost: unitCost != null ? Number(unitCost) : null,
            }
          });
          currentLotId = newLot.id;
        }
      }

      let generatedNote = REASON_TEXT[reason] || "ปรับสต๊อก";
      
      if (lotNumberForNote !== "") {
        generatedNote += ` [Lot: ${lotNumberForNote}]`;
      }

      const transaction = await tx.stockTransaction.create({
        data: {
          variantId: Number(variantId),
          amount: Number(amount),
          type: type,
          reason: reason,
          note: generatedNote,
          profileId: session.user.id,
          variantLotId: currentLotId
        }
      });

      const updatedVariant = await tx.productVariant.update({
        where: { id: Number(variantId) },
        data: {
          stock: {
            increment: type === "IN" ? Number(amount) : -Number(amount)
          }
        }
      });

      return { transaction, updatedVariant };
    });

    return NextResponse.json({
      success: true,
      transaction: result.transaction,
      newStock: result.updatedVariant.stock
    });

  } catch (error: any) {
    console.error("Adjust Stock Error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการปรับสต็อก", error: error.message },
      { status: 500 }
    );
  }
}