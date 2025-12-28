import * as React from "react"
import { cn } from "@/lib/utils"

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Modal({ open, onOpenChange, children }: ModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-card max-w-lg w-full p-12 border border-border/50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

interface ModalHeaderProps {
  title: string
  description?: string
}

export function ModalHeader({ title, description }: ModalHeaderProps) {
  return (
    <div className="mb-10">
      <h3 className="text-3xl font-serif text-foreground mb-3">
        {title}
      </h3>
      {description && (
        <p className="text-muted-foreground text-sm leading-relaxed italic">
          {description}
        </p>
      )}
    </div>
  )
}

interface ModalFooterProps {
  children: React.ReactNode
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="flex justify-end items-center gap-8 mt-12">
      {children}
    </div>
  )
}

interface ModalCancelButtonProps {
  onClick: () => void
  disabled?: boolean
  children?: React.ReactNode
}

export function ModalCancelButton({ onClick, disabled, children = "Cancel" }: ModalCancelButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
      disabled={disabled}
    >
      {children}
    </button>
  )
}
