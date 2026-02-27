import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/utils/db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("กรุณากรอกอีเมลและรหัสผ่าน")
                }
                const user = await prisma.profile.findUnique({
                    where: { email: credentials.email }
                })
                if (!user || !user.password) {
                    throw new Error("ไม่พบผู้ใช้งานนี้ในระบบ")
                }
                const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
                if (!isPasswordValid) {
                    throw new Error("รหัสผ่านไม่ถูกต้อง")
                }
                return {
                    id: user.id,
                    email: user.email,
                    name: `${user.firstname} ${user.lastname}`,
                    role: user.role,
                    image: user.profileImage, // <--- ดึงรูปจาก DB 
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id
                token.role = (user as any).role
                token.picture = user.image // <--- เก็บรูปใน token
            }
            // เพิ่ม trigger "update" เพื่อให้เราสั่งอัปเดต Session จากฝั่ง Client ได้
            if (trigger === "update" && session?.image) {
                token.picture = session.image
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user = {
                    ...session.user,
                    id: token.id as string,
                    role: token.role as string,
                    image: token.picture as string | null, // <--- ส่งรูปเข้า Session
                } as any
            }
            return session
        }
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
}