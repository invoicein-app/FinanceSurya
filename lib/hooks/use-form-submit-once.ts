"use client";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useCallback, useRef, useState, type FormEvent } from "react";

import { useNavProgressOptional } from "@/components/nav-progress-context";

type FormAction = (formData: FormData) => void | Promise<void>;

type UseFormSubmitOnceOptions = {
  action: FormAction;
  /** Return false untuk membatalkan submit (validasi gagal). */
  beforeSubmit?: (event: FormEvent<HTMLFormElement>) => boolean;
  submittingLabel?: string;
  onError?: (error: unknown) => void;
};

/**
 * Cegah double submit: guard ref sinkron + state UI + preventDefault + panggil action manual.
 * Reset otomatis di catch bila server action gagal; tetap disabled setelah sukses (redirect/unmount).
 */
export function useFormSubmitOnce({
  action,
  beforeSubmit,
  submittingLabel = "Menyimpan...",
  onError,
}: UseFormSubmitOnceOptions) {
  const nav = useNavProgressOptional();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isSubmittingRef.current) {
        return;
      }

      if (beforeSubmit && !beforeSubmit(event)) {
        return;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      nav?.startSave();

      try {
        await action(new FormData(event.currentTarget));
        nav?.clearPending();
      } catch (error) {
        if (isRedirectError(error)) {
          throw error;
        }
        nav?.clearPending();
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        onError?.(error);
      }
    },
    [action, beforeSubmit, onError, nav],
  );

  return { isSubmitting, submittingLabel, handleSubmit };
}
