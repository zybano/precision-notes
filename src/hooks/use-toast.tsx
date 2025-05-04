
import * as React from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

// Re-export useToast from the shadcn UI components
export { useToast } from "@/components/ui/use-toast"

// Create a toast convenience function
export const toast = {
  // Default variant toast function
  default: (message: string, options = {}) => {
    const { useToast: useToastFn } = require("@/components/ui/use-toast")
    const { toast } = useToastFn()
    toast({
      title: message,
      variant: "default",
      ...options,
    })
  },
  // Success variant toast function
  success: (message: string, options = {}) => {
    const { useToast: useToastFn } = require("@/components/ui/use-toast")
    const { toast } = useToastFn()
    toast({
      title: message,
      variant: "default",
      className: "bg-green-500 text-white border-green-600",
      ...options,
    })
  },
  // Destructive/error variant toast function
  error: (message: string, options = {}) => {
    const { useToast: useToastFn } = require("@/components/ui/use-toast")
    const { toast } = useToastFn()
    toast({
      title: message,
      variant: "destructive",
      ...options,
    })
  },
  // Warning variant toast function
  warning: (message: string, options = {}) => {
    const { useToast: useToastFn } = require("@/components/ui/use-toast")
    const { toast } = useToastFn()
    toast({
      title: message,
      variant: "default",
      className: "bg-yellow-500 text-white border-yellow-600",
      ...options,
    })
  },
  // Info variant toast function
  info: (message: string, options = {}) => {
    const { useToast: useToastFn } = require("@/components/ui/use-toast")
    const { toast } = useToastFn()
    toast({
      title: message,
      variant: "default",
      className: "bg-blue-500 text-white border-blue-600",
      ...options,
    })
  },
}
