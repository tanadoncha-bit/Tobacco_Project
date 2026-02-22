import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Gender } from "@/components/owner/employee/EmployeeForm";

type CreateEmployeeBody = {
  firstname: string;
  lastname: string;
  email: string;
  tel: string;
  address: string;
  gender: Gender;
  dateOfBirth: string; // yyyy-mm-dd
  ssn: string;
  position: string;
  salary: string;
};

function isCreateEmployeeBody(x: unknown): x is CreateEmployeeBody {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;

  const isString = (v: unknown) => typeof v === "string" && v.trim().length > 0;
  const isGender = (v: unknown): v is Gender =>
    v === "MALE" || v === "FEMALE" || v === "OTHER";

  return (
    isString(o.firstname) &&
    isString(o.lastname) &&
    isString(o.email) &&
    isString(o.tel) &&
    isString(o.address) &&
    isGender(o.gender) &&
    isString(o.dateOfBirth) &&
    isString(o.ssn) &&
    isString(o.position) &&
    isString(o.salary)
  );
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();

    if (!isCreateEmployeeBody(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const salary = Number(body.salary);
    if (!Number.isFinite(salary) || salary < 0) {
      return NextResponse.json({ error: "Invalid salary" }, { status: 400 });
    }

    const dob = new Date(body.dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      return NextResponse.json({ error: "Invalid dateOfBirth" }, { status: 400 });
    }

    const employee = await prisma.employee.create({
      data: {
        firstname: body.firstname.trim(),
        lastname: body.lastname.trim(),
        email: body.email.trim(),
        tel: body.tel.trim(),
        address: body.address.trim(),
        gender: body.gender,
        dateOfBirth: dob,
        ssn: body.ssn.trim(),
        position: body.position.trim(),
        salary,
      },
      select: { id: true },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
