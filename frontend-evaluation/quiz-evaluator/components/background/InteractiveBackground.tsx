"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function InteractiveBackground() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at top, #1a2a44 0%, #0f172a 100%)"
            : "radial-gradient(ellipse at top, #e6f7ff 0%, #f8fafc 100%)",
        }}
      />

      {isDark && (
        <div className="absolute inset-0">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: Math.random() * 2 + 1,
                height: Math.random() * 2 + 1,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random(),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
