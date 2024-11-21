import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md px-6 font-medium transition-all duration-300",
          "before:absolute before:inset-0 before:transition-all before:duration-500 hover:before:scale-110",
          variant === "primary" 
            ? "text-white before:bg-gradient-to-r before:from-indigo-500 before:via-purple-500 before:to-pink-500"
            : "text-gray-900 before:bg-gradient-to-r before:from-amber-200 before:via-violet-200 before:to-pink-200",
          "shadow-[0_0_0_1px_rgba(0,0,0,0.1)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.2)]",
          className
        )}
        {...props}
      >
        <span className="relative z-10">{props.children}</span>
      </button>
    );
  }
);

GradientButton.displayName = "GradientButton";

export { GradientButton };