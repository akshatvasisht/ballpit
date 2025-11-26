import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--electric-cyan)] focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary: Electric Cyan with glow on hover
        default:
          "bg-[var(--electric-cyan)] text-white rounded-md hover:shadow-[0_0_20px_var(--cyan-glow)] hover:scale-[1.02] active:scale-[0.98]",

        // Secondary: Slate Blue outline
        secondary:
          "bg-transparent text-[var(--slate-blue)] border-2 border-[var(--slate-blue)] rounded-md hover:bg-[var(--slate-blue)] hover:text-white hover:scale-[1.02] active:scale-[0.98]",

        // Destructive: Muted Red
        destructive:
          "bg-[var(--error)] text-white rounded-md hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]",

        // Ghost: Minimal, text only
        ghost:
          "bg-transparent hover:bg-black/5 active:bg-black/10 rounded-md",

        // Outline: Neutral outline
        outline:
          "bg-transparent border border-[var(--border)] hover:bg-black/5 rounded-md",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onDrag" | "onDragStart" | "onDragEnd" | "style">,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  style?: React.CSSProperties; // Explicitly define style to standard React styles
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, onClick, ...props }, ref) => {
    const content = loading ? (
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span>Loading...</span>
      </div>
    ) : (
      children
    );

    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          {...props}
          onClick={onClick}
        >
          {children}
        </Slot>
      );
    }

    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        whileHover={{ scale: variant === "ghost" || variant === "outline" ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        type={props.type}
        aria-label={props["aria-label"]}
      >
        {content}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
