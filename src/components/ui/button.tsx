import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

/**
 * The platform's single button. Variant set comes from the Book Travels
 * luxury language (gold, gradients, glass); every route uses this one.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-gold text-black hover:bg-gold/90 shadow-gold hover:shadow-gold-lg",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border-2 border-input bg-background hover:bg-gold/5 hover:text-gold hover:border-gold/40",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-gold/5 hover:text-gold",
        link: "text-gold underline-offset-4 hover:underline",
        gradient:
          "bg-linear-to-r from-gold to-gold-light text-black hover:from-gold-light hover:to-gold shadow-gold hover:shadow-gold-lg",
        "gradient-luxury":
          "bg-linear-to-r from-gold via-gold-light to-gold text-black hover:opacity-90 shadow-gold-lg hover:shadow-glow-gold-xl",
        glass: "glass-luxury border-gold/20 text-gold hover:bg-gold/10 hover:border-gold/40",
        "glass-luxury":
          "glass-luxury-card border-gold/20 text-warm-white hover:bg-gold/5 hover:border-gold/40",
        "gold-glow":
          "bg-gold text-black hover:bg-gold-light shadow-gold hover:shadow-gold-lg border border-gold/40",
        "gold-outline":
          "border-2 border-gold/40 bg-transparent text-gold hover:bg-gold/10 hover:border-gold/60",
        "luxury-primary":
          "bg-linear-to-r from-gold to-gold-dark text-black hover:from-gold-light hover:to-gold shadow-gold-lg hover:shadow-glow-gold-xl",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-xl px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Shows a spinner and disables the button while true. */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size="sm" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
