"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      style={
        active
          ? { background: "var(--accent)", color: "#fff" }
          : { color: "var(--sidebar-text)" }
      }
      className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
    >
      {children}
    </Link>
  );
}
