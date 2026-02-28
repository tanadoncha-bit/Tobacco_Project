import { authOptions } from "@/utils/authOptions";
import prisma from "@/utils/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const { items, totalAmount } = data;

    if (!items || items.length === 0) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const profileId = session?.user?.id;

    if (!profileId) {
      return NextResponse.json({ message: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });
    }

    const newOrder = await prisma.$transaction(async (tx) => {

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

      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId }
        });

        if (!variant || variant.stock < item.quantity) {
          throw new Error(`สินค้าสต๊อกไม่เพียงพอสำหรับสั่งซื้อ`);
        }

        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { decrement: item.quantity }
          }
        });
        
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