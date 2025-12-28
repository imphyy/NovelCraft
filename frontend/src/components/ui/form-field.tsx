import * as React from "react"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label: string
  htmlFor?: string
  className?: string
  children: React.ReactNode
}

export function FormField({ label, htmlFor, className, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={htmlFor}
        className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
      >
        {label}
      </label>
      {children}
    </div>
  )
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  serif?: boolean
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, serif, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full bg-transparent border-b border-border/50 py-2 focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/20",
          serif ? "font-serif text-xl" : "text-sm",
          className
        )}
        {...props}
      />
    )
  }
)
FormInput.displayName = "FormInput"

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full bg-transparent border border-border/30 p-3 focus:border-primary focus:outline-none transition-colors resize-none placeholder:text-muted-foreground/20 text-sm leading-relaxed",
          className
        )}
        {...props}
      />
    )
  }
)
FormTextarea.displayName = "FormTextarea"

interface FormErrorProps {
  children: React.ReactNode
}

export function FormError({ children }: FormErrorProps) {
  return (
    <div className="bg-destructive/5 text-destructive text-xs px-4 py-3 border-l-2 border-destructive mb-8">
      {children}
    </div>
  )
}
