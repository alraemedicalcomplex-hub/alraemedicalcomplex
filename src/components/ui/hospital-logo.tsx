import React from "react";
import { cn } from "@/lib/utils";

interface HospitalLogoProps {
  className?: string;
  size?: number;
}

export function HospitalLogo({ className, size = 36 }: HospitalLogoProps) {
  return (
    <img
      src="/favicon.svg"
      alt="Al Rae Hospital Logo"
      width={size}
      height={size}
      className={cn("rounded-xl object-contain drop-shadow select-none", className)}
    />
  );
}
