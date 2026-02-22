import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Ctx = { params: { id: string } };

export async function DELETE(_req: Request, ctx: Ctx) {
  const raw = ctx.params.id;
  const id = Number(raw);

  if (!Number.isFinite(id)) {
    return NextResponse.json(
      { error: `Invalid id: ${raw}` },
      { status: 400 }
    );
  }

  try {
    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}