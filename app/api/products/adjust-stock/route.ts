import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {

    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized - กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const body = await req.json();

    const { variantId, amount, type, reason, reference, note } = body;

    if (!variantId || !amount || !type || !reason || !reference) {
      return NextResponse.json(
        { message: "ข้อมูลไม่ครบถ้วน (ต้องระบุสาเหตุและเลขอ้างอิง)" },
        { status: 400 }
      );
    }

    const transaction = await prisma.stockTransaction.create({
      data: {
        variantId: Number(variantId),
        amount: Number(amount),
        type: type,
        reason: reason,
        reference: reference,
        note: note || null,
        profileId: session.user.id
      }
    });

    const updatedVariant = await prisma.productVariant.update({
      where: { id: Number(variantId) },
      data: {
        stock: {
          increment: type === "IN" ? Number(amount) : -Number(amount)
        }
      }
    });

    return NextResponse.json({
      success: true,
      transaction,
      newStock: updatedVariant.stock
    });

  } catch (error: any) {
    console.error("Adjust Stock Error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการปรับสต็อก", error: error.message },
      { status: 500 }
    );
  }
}