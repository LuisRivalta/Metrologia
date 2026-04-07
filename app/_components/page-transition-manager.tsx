"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const PAGE_TRANSITION_CLASS = "page-is-transitioning";

export function PageTransitionManager() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.remove(PAGE_TRANSITION_CLASS);
  }, [pathname]);

  return null;
}
