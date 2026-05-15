import { cn } from "../../lib/utils";

export const Badge = ({ className, ...props }) => (
  <span
    className={cn(
      "inline-flex items-center gap-2 rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white",
      className
    )}
    {...props}
  />
);
