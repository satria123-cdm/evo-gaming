"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Small floating "back to home" control for every page.
 *
 * It is rendered by the root layout, so each page (public and admin) gets it
 * automatically; it only hides on the homepage itself. The button fades and
 * rises into place shortly after the page settles so it never competes with
 * the content on first paint.
 */
export function BackToHome() {
  const pathname = usePathname() ?? "/";
  const [shown, setShown] = useState(false);

  const hidden = pathname === "/";

  useEffect(() => {
    if (hidden) return;
    const timer = window.setTimeout(() => setShown(true), 400);
    return () => window.clearTimeout(timer);
  }, [hidden]);

  if (hidden) return null;

  return (
    <Link
      href="/"
      aria-label="Kembali ke beranda"
      className={`back-home${shown ? " is-visible" : ""}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5" />
        <path d="m11 6-6 6 6 6" />
      </svg>
      <span>Beranda</span>
    </Link>
  );
}
