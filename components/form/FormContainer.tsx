'use client'
import { useActionState } from "react"
import { toast } from "sonner"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { actionFunction } from "@/utils/types"

const initialState = {
    message: '',
    redirectUrl: ''
}

const FormContainer = ({ action, children, className }: { action: actionFunction, children: React.ReactNode, className?: string }) => {
    const [state, formAction] = useActionState(action, initialState)
    const router = useRouter()

    useEffect(() => {
        if (state.message) {
            // โชว์ Toast
            toast.success(state.message, { position: "top-center", className: "whitespace-pre-line" })
            
            if (state.redirectUrl) {
                setTimeout(() => {
                    router.push(state.redirectUrl as string)
                }, 1000)
            }
        }
    }, [state, router])

    return (
        <form action={formAction} className={className}>
            {children}
        </form>
    )
}
export default FormContainer