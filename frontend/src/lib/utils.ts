import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "ETB") {
  return new Intl.NumberFormat("en-ET", { style: "currency", currency }).format(amount);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
}

export function getInitials(name?: string | null) {
  if (!name || typeof name !== "string") return "U";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  const detail = (error as { response?: { data?: { detail?: unknown } } } | null | undefined)
    ?.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          const msg = (item as { msg?: unknown }).msg;
          return typeof msg === "string" ? msg : "";
        }
        return "";
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(", ");
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function getBackendOrigin() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  return apiUrl.replace(/\/api\/?$/, "");
}

export function resolveMediaUrl(url?: string | null) {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  const origin = getBackendOrigin();
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

export const LEVEL_COLORS: Record<string, string> = {
  beginner: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  intermediate: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  advanced: "text-rose-400 bg-rose-400/10 border-rose-400/20",
};

export const CATEGORY_ICONS: Record<string, string> = {
  programming: "💻",
  design: "🎨",
  business: "💼",
  marketing: "📢",
  data_science: "📊",
  devops: "⚙️",
  mobile: "📱",
  other: "📚",
};
