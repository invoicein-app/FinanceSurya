"use client";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useCallback } from "react";

import { useNavProgressOptional } from "@/components/nav-progress-context";

/**
 * Bungkus server action / mutasi agar overlay main content ikut tampil.
 * Redirect Next.js tidak di-clear di sini — pathname change yang reset state.
 */
export function useMutationLoading() {
  const nav = useNavProgressOptional();

  const wrapSave = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      nav?.startSave();
      try {
        const result = await fn();
        nav?.clearPending();
        return result;
      } catch (error) {
        if (isRedirectError(error)) {
          throw error;
        }
        nav?.clearPending();
        throw error;
      }
    },
    [nav],
  );

  const wrapDelete = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      nav?.startDelete();
      try {
        const result = await fn();
        nav?.clearPending();
        return result;
      } catch (error) {
        if (isRedirectError(error)) {
          throw error;
        }
        nav?.clearPending();
        throw error;
      }
    },
    [nav],
  );

  return {
    startSave: () => nav?.startSave(),
    startDelete: () => nav?.startDelete(),
    clearPending: () => nav?.clearPending(),
    wrapSave,
    wrapDelete,
  };
}
