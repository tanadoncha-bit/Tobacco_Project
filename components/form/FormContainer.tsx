'use client'
import { useActionState } from "react"
import { toast } from "sonner"
import { useEffect } from "react"
import { actionFunction } from "@/utils/types"

const initialState = {
    message: ''
}

const FormContainer = ({ action, children, className }: { action: actionFunction, children: React.ReactNode, className: string }) => {
    const [state, formAction] = useActionState(action, initialState)

    useEffect(() => {
        if (state.message) {
            toast.success(state.message, {position: "top-center",className: "whitespace-pre-line"})
        }
    }, [state])

    return (
        <form action={formAction} className={className}>
            {children}
        </form>
    )
}
export default FormContainer