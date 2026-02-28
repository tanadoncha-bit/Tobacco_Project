// ไฟล์: app/api/productions/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { variantId, amount, note } = body;

    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, '');

    const lastOrder = await prisma.productionOrder.findFirst({
      where: { docNo: { startsWith: `PD-${datePrefix}` } },
      orderBy: { id: 'desc' }
    });

    let runningNumber = 1;
    if (lastOrder) {
      const lastRunningStr = lastOrder.docNo.split('-')[2]; 
      runningNumber = parseInt(lastRunningStr) + 1;
    }

    const formattedRunning = runningNumber.toString().padStart(3, '0');
    const newDocNo = `PD-${datePrefix}-${formattedRunning}`; 

    const result = await prisma.$transaction(async (tx) => {
      
      const newOrder = await tx.productionOrder.create({
        data: {
          docNo: newDocNo,
          variantId: Number(variantId),
          amount: Number(amount),
          note: note,
          status: "PENDING"
        }
      });

      // 2.2 โค้ดตัดสต๊อก "วัตถุดิบ" ตามสูตร (Recipe)
      // ตรงนี้คุณต้องเขียน Logic วนลูปเช็คสูตรแล้วไปลดสต๊อกวัตถุดิบ (Material)
      // ... (รอใส่ Logic ตัดวัตถุดิบ) ...

      return newOrder;
    });

    return NextResponse.json({ 
      message: "สั่งผลิตสำเร็จ", 
      docNo: result.docNo 
    });

  } catch (error: any) {
    console.error("Create Production Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสั่งผลิต" }, { status: 500 });
  }
}