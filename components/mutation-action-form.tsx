"use client";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import type { FormHTMLAttributes, ReactNode } from "react";

import { useNavProgressOptional } from "@/components/nav-progress-context";

type MutationKind = "save" | "delete";

type MutationActionFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit"> & {
  action: (formData: FormData) => void | Promise<void>;
  mutationKind?: MutationKind;
  children: ReactNode;
};

export function MutationActionForm({
  action,
  mutationKind = "save",
  children,
  ...formProps
}: MutationActionFormProps) {
  const nav = useNavProgressOptional();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mutationKind === "delete") {
      nav?.startDelete();
    } else {
      nav?.startSave();
    }

    try {
      await action(new FormData(event.currentTarget));
      nav?.clearPending();
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }
      nav?.clearPending();
      throw error;
    }
  };

  return (
    <form {...formProps} onSubmit={(event) => void handleSubmit(event)}>
      {children}
    </form>
  );
}
