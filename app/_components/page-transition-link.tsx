"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { useEffect, useRef } from "react";

const PAGE_TRANSITION_CLASS = "page-is-transitioning";
const PAGE_TRANSITION_DURATION_MS = 240;

type PageTransitionLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> & {
  href: string;
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  prefetch?: boolean | null;
  replace?: boolean;
  scroll?: boolean;
  disableTransition?: boolean;
};

function shouldBypassTransition(event: MouseEvent<HTMLAnchorElement>, target?: string) {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (typeof target === "string" && target !== "_self")
  );
}

export function PageTransitionLink({
  href,
  children,
  onClick,
  prefetch,
  replace,
  scroll,
  disableTransition = false,
  target,
  ...props
}: PageTransitionLinkProps) {
  const router = useRouter();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (disableTransition || shouldBypassTransition(event, target)) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const nextPath = href.split("#")[0]?.split("?")[0] ?? href;
    if (nextPath === window.location.pathname) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    event.preventDefault();

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    document.documentElement.classList.add(PAGE_TRANSITION_CLASS);

    timeoutRef.current = window.setTimeout(() => {
      if (replace) {
        router.replace(href, { scroll });
        return;
      }

      router.push(href, { scroll });
    }, PAGE_TRANSITION_DURATION_MS);
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      prefetch={prefetch}
      replace={replace}
      scroll={scroll}
      target={target}
      {...props}
    >
      {children}
    </Link>
  );
}
