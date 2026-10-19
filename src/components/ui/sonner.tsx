import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * The one platform toast layer. Sonner v2 themes toasts through CSS custom
 * properties, so we map its vars onto the design tokens instead of fighting
 * its stylesheet with class names.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      style={
        {
          "--normal-bg": "var(--background)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--background)",
          "--success-text": "var(--foreground)",
          "--success-border": "var(--border)",
          "--error-bg": "var(--background)",
          "--error-text": "var(--foreground)",
          "--error-border": "var(--destructive)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          description: "text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
