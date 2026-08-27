"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Révélation au scroll — amélioration progressive.
 * Le masquage dépend de la classe .js sur <html> (posée dans le layout) :
 * sans JavaScript, le contenu reste visible.
 */
export function Reveal({
  children,
  as: Tag = "div",
  className = "",
  delayIndex = 0,
}: {
  children: ReactNode;
  as?: "div" | "article" | "figure" | "section";
  className?: string;
  delayIndex?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${visible ? "is-in" : ""} ${className}`.trim()}
      style={{ transitionDelay: `${(delayIndex % 4) * 70}ms` }}
    >
      {children}
    </Tag>
  );
}
