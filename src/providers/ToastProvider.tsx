import * as React from "react"
import { toast as sonnerToast } from "sonner"

// Context for the toast functions
export const ToastContext = React.createContext<{
  toast: typeof sonnerToast
} | null>(null)

// Provider component that wraps the application
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastContext.Provider value={{ toast: sonnerToast }}>
      {children}
    </ToastContext.Provider>
  )
}

// Custom hook to use toast
export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// Simplified toast API
export const toast = sonnerToast;
