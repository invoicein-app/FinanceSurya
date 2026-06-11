"use client";

import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const CONTENT_LOADING_TIMEOUT_MS = 15_000;

export type ContentLoadingKind = "navigate" | "save" | "delete";

type PendingState = {
  kind: ContentLoadingKind;
  href?: string;
};

type NavProgressContextValue = {
  /** True saat navigasi, simpan, atau hapus sedang berjalan. */
  isNavigating: boolean;
  isContentLoading: boolean;
  pendingKind: ContentLoadingKind | null;
  pendingHref: string | null;
  startNavigation: (href: string) => void;
  startSave: () => void;
  startDelete: () => void;
  clearPending: () => void;
};

const NavProgressContext = createContext<NavProgressContextValue | null>(null);

const LOADING_COPY: Record<ContentLoadingKind, { title: string; subtitle: string }> = {
  navigate: { title: "Sedang memuat...", subtitle: "Mohon tunggu..." },
  save: { title: "Menyimpan data...", subtitle: "Mohon tunggu..." },
  delete: { title: "Menghapus data...", subtitle: "Mohon tunggu..." },
};

export function normalizeNavPath(href: string): string {
  const trimmed = href.trim();
  if (!trimmed) {
    return "/";
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      return new URL(trimmed).pathname || "/";
    } catch {
      return "/";
    }
  }
  const withoutHash = trimmed.split("#")[0] ?? trimmed;
  const withoutQuery = withoutHash.split("?")[0] ?? withoutHash;
  if (!withoutQuery || withoutQuery === "") {
    return "/";
  }
  return withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
}

export function NavContentLoadingOverlay({ kind = "navigate" }: { kind?: ContentLoadingKind }) {
  const copy = LOADING_COPY[kind];

  return (
    <div
      className="app-shell-main__overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={copy.title}
    >
      <div className="app-shell-main__overlay-card">
        <Loader2 className="size-9 animate-spin text-primary" strokeWidth={2} aria-hidden />
        <p className="text-sm font-semibold text-foreground">{copy.title}</p>
        <p className="text-xs text-muted-foreground">{copy.subtitle}</p>
      </div>
    </div>
  );
}

export function NavProgressProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [pending, setPending] = useState<PendingState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPending = useCallback(() => {
    setPending(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const armTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setPending(null);
      timeoutRef.current = null;
    }, CONTENT_LOADING_TIMEOUT_MS);
  }, []);

  const startPending = useCallback(
    (kind: ContentLoadingKind, href?: string) => {
      setPending({ kind, href });
      armTimeout();
    },
    [armTimeout],
  );

  useEffect(() => {
    clearPending();
  }, [pathname, clearPending]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startNavigation = useCallback(
    (href: string) => {
      const target = normalizeNavPath(href);
      const current = normalizeNavPath(pathname);
      if (target === current) {
        return;
      }
      startPending("navigate", href);
    },
    [pathname, startPending],
  );

  const startSave = useCallback(() => {
    startPending("save");
  }, [startPending]);

  const startDelete = useCallback(() => {
    startPending("delete");
  }, [startPending]);

  const isContentLoading = pending !== null;

  const value = useMemo<NavProgressContextValue>(
    () => ({
      isNavigating: isContentLoading,
      isContentLoading,
      pendingKind: pending?.kind ?? null,
      pendingHref: pending?.href ?? null,
      startNavigation,
      startSave,
      startDelete,
      clearPending,
    }),
    [isContentLoading, pending, startNavigation, startSave, startDelete, clearPending],
  );

  return <NavProgressContext.Provider value={value}>{children}</NavProgressContext.Provider>;
}

export function useNavProgress(): NavProgressContextValue {
  const ctx = useContext(NavProgressContext);
  if (!ctx) {
    throw new Error("useNavProgress must be used within NavProgressProvider");
  }
  return ctx;
}

export function useNavProgressOptional(): NavProgressContextValue | null {
  return useContext(NavProgressContext);
}
