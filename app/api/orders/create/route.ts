import { authOptions } from "@/utils/authOptions";
import prisma from "@/utils/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 1. 🧹 เอา profileId ออกจากตรงนี้ เพราะเราจะดึงจาก Session เพื่อความปลอดภัยและป้องกันตัวแปรซ้ำ
    const { items, totalAmount } = data;

    if (!items || items.length === 0) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // 2. 🛡️ เช็ค Session ว่ามีคนล็อกอินอยู่ไหม ก่อนเริ่มทำ Transaction
    const session = await getServerSession(authOptions);
    const profileId = session?.user?.id;

    if (!profileId) {
      return NextResponse.json({ message: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });
    }

    // 🔥 ใช้ Transaction
    const newOrder = await prisma.$transaction(async (tx) => {

      // 3. สร้างใบคำสั่งซื้อ (Order)
      const order = await tx.order.create({
        data: {
          profileId: profileId,
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

      // 4. วนลูปจัดการสต๊อกทีละรายการ
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId }
        });

        if (!variant || variant.stock < item.quantity) {
          throw new Error(`สินค้าสต๊อกไม่เพียงพอสำหรับสั่งซื้อ`);
        }

        // ตัดสต๊อกสินค้าสำเร็จรูป (ProductVariant)
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { decrement: item.quantity }
          }
        });

        // 5. บันทึกประวัติการขายออกลง StockTransaction
        // 🚨 คำเตือน: ตรวจสอบให้แน่ใจว่าในไฟล์ schema.prisma ตาราง StockTransaction มีคอลัมน์ profileId จริงๆ นะครับ! 
        // ถ้าไม่มี แนะนำให้ลบบรรทัด profileId ข้างล่างนี้ทิ้งไปเลยครับ ไม่งั้นจะ Error เหมือนตอน createdBy ครับ
        const shortOrderId = order.id.substring(0, 8).toUpperCase()
        
        await tx.stockTransaction.create({
          data: {
            variantId: item.variantId,
            type: "OUT",
            amount: item.quantity,
            note: `ขายสินค้า ออเดอร์ #ORD-${shortOrderId}`,
            profileId: profileId,
          }
        });
      }

      return order;
    });

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error: any) {
    console.error("CREATE_ORDER_ERROR:", error);
    return NextResponse.json({ message: error.message || "เกิดข้อผิดพลาดในการสั่งซื้อ" }, { status: 500 });
  }
}