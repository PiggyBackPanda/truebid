"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text"
          >
            {label}
            {props.required && (
              <span className="text-red ml-1" aria-hidden>
                *
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full bg-white border rounded-[10px] px-4 py-3 text-sm text-text placeholder:text-text-light transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky",
            error
              ? "border-red focus:border-red focus:ring-red/20"
              : "border-border",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-text-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
