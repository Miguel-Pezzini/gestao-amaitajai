import { Loader2 } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const spinnerVariants = cva("animate-spin text-ama-blue", {
  variants: {
    size: {
      sm: "size-4",
      md: "size-6",
      lg: "size-8",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

function Spinner({ size, className, ...props }) {
  return (
    <Loader2
      className={cn(spinnerVariants({ size }), className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Spinner, spinnerVariants };
