"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string; // e.g. "max-w-md" | "max-w-lg" | "max-w-xl" | "max-w-2xl" | "max-w-3xl"
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-2xl",
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when modal is active
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
    >
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        <div
          className={`w-full ${maxWidth} rounded-2xl border border-border bg-[#111827] p-6 sm:p-8 text-left shadow-2xl relative animate-in fade-in zoom-in-95 duration-150`}
          onClick={(e) => e.stopPropagation()}
        >
          {(title || description) && (
            <div className="flex items-start justify-between pb-4 mb-5 border-b border-border/80">
              <div>
                {title && (
                  <h3 className="text-xl font-bold text-foreground">{title}</h3>
                )}
                {description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 rounded-lg border border-border bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition shrink-0 ml-4"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
