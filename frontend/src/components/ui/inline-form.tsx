import * as React from "react"
import { cn } from "@/lib/utils"

interface InlineFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
}

export function InlineForm({ children, className, ...props }: InlineFormProps) {
  return (
    <form
      className={cn("mb-6 p-3 bg-muted/10 rounded border border-border/10", className)}
      {...props}
    >
      {children}
    </form>
  )
}

interface InlineFormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const InlineFormInput = React.forwardRef<HTMLInputElement, InlineFormInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full px-2 py-1.5 text-xs border border-border/10 rounded mb-2 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/30",
          className
        )}
        {...props}
      />
    )
  }
)
InlineFormInput.displayName = "InlineFormInput"

interface InlineFormActionsProps {
  children: React.ReactNode
}

export function InlineFormActions({ children }: InlineFormActionsProps) {
  return <div className="flex gap-2">{children}</div>
}

interface InlineFormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary"
}

export function InlineFormButton({
  variant = "primary",
  className,
  children,
  ...props
}: InlineFormButtonProps) {
  return (
    <button
      className={cn(
        "flex-1 px-2 py-1 text-[10px] rounded transition-opacity uppercase tracking-widest font-semibold",
        variant === "primary"
          ? "bg-primary/80 text-primary-foreground hover:opacity-90"
          : "text-muted-foreground/60 hover:text-foreground transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

interface InlineFormErrorProps {
  children: React.ReactNode
}

export function InlineFormError({ children }: InlineFormErrorProps) {
  return <div className="text-[10px] text-destructive mb-2">{children}</div>
}

interface InlineFormLabelProps {
  children: React.ReactNode
}

export function InlineFormLabel({ children }: InlineFormLabelProps) {
  return (
    <label className="block text-[10px] text-muted-foreground/50 mb-1 uppercase tracking-wider">
      {children}
    </label>
  )
}
