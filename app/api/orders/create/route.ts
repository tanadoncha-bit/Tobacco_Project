import prisma from "@/utils/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // รับข้อมูลจากหน้าร้าน (สมมติว่าส่ง profileId และ items มา)
    // items ควรมีหน้าตา [{ variantId: 1, quantity: 2, price: 150 }, ...]
    const { profileId, items, totalAmount } = data;

    if (!profileId || !items || items.length === 0) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // 🔥 ใช้ Transaction: หากเกิดข้อผิดพลาดจุดใดจุดหนึ่ง ระบบจะยกเลิกการทำงานทั้งหมดให้ (Rollback)
    const newOrder = await prisma.$transaction(async (tx) => {
      
      // 1. สร้างใบคำสั่งซื้อ (Order)
      const order = await tx.order.create({
        data: {
          profileId,
          totalAmount: Number(totalAmount),
          status: "PENDING",
          items: {
            create: items.map((item: any) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });

      // 2. วนลูปจัดการสต๊อกทีละรายการ "สินค้าที่ลูกค้าซื้อ"
      for (const item of items) {
        // เช็คว่าสต๊อกสินค้ามีพอหรือไม่
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId }
        });

        if (!variant || variant.stock < item.quantity) {
          throw new Error(`สินค้าสต๊อกไม่เพียงพอสำหรับสั่งซื้อ`);
        }

        // ตัดสต๊อกสินค้าสำเร็จรูป (ProductVariant) โดยใช้ decrement
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { decrement: item.quantity }
          }
        });

        // บันทึกประวัติการขายออกลง StockTransaction
        await tx.stockTransaction.create({
          data: {
            variantId: item.variantId,
            type: "OUT",
            amount: item.quantity,
            note: `ขายสินค้า ออเดอร์ #${order.id}`,
            createdBy: "System",
          }
        });
      }

      // ถ้าในโค้ดเดิมของคุณมีการลบตะกร้าสินค้าด้วย สามารถใส่คำสั่ง tx.cartItem.deleteMany(...) ไว้ตรงนี้ได้เลย

      return order;
    });

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error: any) {
    console.error("CREATE_ORDER_ERROR:", error);
    return NextResponse.json({ message: error.message || "เกิดข้อผิดพลาดในการสั่งซื้อ" }, { status: 500 });
  }
}