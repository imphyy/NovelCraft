import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground shadow-glow-blue hover:shadow-glow-blue-hover hover:-translate-y-0.5",
        gold: "bg-gradient-gold text-primary-foreground shadow-glow-gold hover:shadow-glow-gold-hover hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:opacity-90",
        outline:
          "border border-border bg-transparent hover:bg-muted/50 hover:text-foreground hover:border-primary/50 transition-all",
        secondary:
          "bg-muted text-foreground border border-border/40 hover:bg-muted/80 shadow-soft",
        ghost: "hover:bg-muted/30 hover:text-foreground text-muted-foreground transition-colors",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
