import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
}

export default function LoadingSpinner({ text = "กำลังเตรียมข้อมูล..." }: LoadingSpinnerProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 w-full">
      <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
      <p className="text-gray-500 font-medium animate-pulse">
        {text}
      </p>
    </div>
  );
}