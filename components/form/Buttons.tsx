'use client'
import { LoaderCircle } from 'lucide-react';
import { useFormStatus } from "react-dom"
import { Button } from "../ui/button"

type btnSize = 'default' | 'lg' | 'sm'

type Buttonprops = {
    text?: string
    size?: btnSize
    className?: string
}

export const SubmitButton = (props: Buttonprops) => {
    const { text, size, className } = props
    const {pending} = useFormStatus()
    return <Button disabled={pending} className={className} size={size} type="submit">
        {
            pending
            ? <span className="flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" />Loading</span>
            : <p>{text}</p>
        }
    </Button>
}