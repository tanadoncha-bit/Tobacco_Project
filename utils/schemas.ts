import { z, ZodSchema } from 'zod'

export const profileSchema = z.object({
  firstname: z.string().min(2, { message: 'firstname must contain at least 2 character' }),
  lastname: z.string().min(2, { message: 'lastname must contain at least 2 character' }),
  email: z.string().email("Invalid email format"),
  address: z.string().min(1, "Address is required"),
  phonenumber: z.string().transform((val) => val.replace(/\D/g, "")).refine((val) => val.length === 10, {message: "Phone number must contain exactly 10 digits"}),
  birthdate: z.string()
})

export const validateWithZod = <T>(schema:ZodSchema<T>, data:unknown):T => {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `• ${issue.message}`
    )
    throw new Error(errors.join('\n'))
  }
  return result.data
}

