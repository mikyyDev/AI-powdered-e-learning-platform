import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "LearnPath — AI-Powered Learning",
  description: "Master new skills with AI-guided learning paths, real-time chat, and expert instructors.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0d0d22",
              color: "#e2e2f0",
              border: "1px solid rgba(103,65,255,0.2)",
              borderRadius: "12px",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#a78bfa", secondary: "#04040d" } },
            error: { iconTheme: { primary: "#f87171", secondary: "#04040d" } },
          }}
        />
      </body>
    </html>
  );
}
