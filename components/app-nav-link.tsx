"use client";

import Link, { type LinkProps } from "next/link";
import type { ComponentProps, MouseEvent } from "react";

import { normalizeNavPath, useNavProgressOptional } from "@/components/nav-progress-context";

type AppNavLinkProps = ComponentProps<typeof Link>;

function hrefToPath(href: LinkProps["href"]): string {
  if (typeof href === "string") {
    return normalizeNavPath(href);
  }
  const pathname = href.pathname ?? "/";
  return normalizeNavPath(pathname);
}

function isInternalHref(href: LinkProps["href"]): boolean {
  if (typeof href === "string") {
    return (
      !href.startsWith("http://") &&
      !href.startsWith("https://") &&
      !href.startsWith("//") &&
      !href.startsWith("mailto:") &&
      !href.startsWith("tel:")
    );
  }
  return true;
}

export function AppNavLink({ href, onClick, ...props }: AppNavLinkProps) {
  const nav = useNavProgressOptional();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }
    if (event.button !== 0) {
      return;
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    if (!isInternalHref(href)) {
      return;
    }

    const hrefStr = typeof href === "string" ? href : href.pathname ?? "/";
    nav?.startNavigation(hrefStr);
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}

export { hrefToPath };
