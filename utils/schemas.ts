import { z, ZodSchema } from "zod"

// แก้ไข: ลบ birthdate ออก เพราะ Profile model ใน schema.prisma ไม่มี field นี้
// ถ้าเพิ่ม birthdate กลับเข้าไป ต้องทำ migration ก่อน
export const profileSchema = z.object({
  firstname: z.string().min(2, { message: "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร" }),
  lastname: z.string().min(2, { message: "นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร" }),
  phonenumber: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length === 10, { message: "เบอร์โทรศัพท์ต้องมี 10 หลัก" }),
  address: z.string().min(1, { message: "กรุณากรอกที่อยู่" }),
})

export const registerSchema = z.object({
  firstname: z.string().min(2, { message: "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร" }),
  lastname: z.string().min(2, { message: "นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร" }),
  email: z.string().email({ message: "รูปแบบอีเมลไม่ถูกต้อง" }),
  password: z.string().min(6, { message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }),
})

export const validateWithZod = <T>(schema: ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.issues.map((issue) => `• ${issue.message}`)
    throw new Error(errors.join("\n"))
  }
  return result.data
}