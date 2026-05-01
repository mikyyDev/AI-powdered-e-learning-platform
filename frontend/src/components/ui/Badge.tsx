import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export default function Badge({ children, className, variant = "default" }: BadgeProps) {
  const variants = {
    default: "bg-brand-500/10 text-brand-300 border-brand-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border", variants[variant], className)}>
      {children}
    </span>
  );
}
