"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";

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

      try {
        await action(new FormData(event.currentTarget));
      } catch (error) {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        onError?.(error);
      }
    },
    [action, beforeSubmit, onError],
  );

  return { isSubmitting, submittingLabel, handleSubmit };
}
