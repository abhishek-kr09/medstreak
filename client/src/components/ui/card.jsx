import { cn } from "../../lib/utils";

export const Card = ({ className, ...props }) => (
  <div
    className={cn(
      "rounded-3xl border border-white/60 bg-white/80 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.6)] backdrop-blur",
      className
    )}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }) => (
  <div className={cn("p-6 pb-2", className)} {...props} />
);

export const CardTitle = ({ className, ...props }) => (
  <h3 className={cn("text-xl font-semibold text-slate-900", className)} {...props} />
);

export const CardContent = ({ className, ...props }) => (
  <div className={cn("p-6 pt-2", className)} {...props} />
);
