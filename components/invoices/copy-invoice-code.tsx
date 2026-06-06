"use client";

import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyInvoiceCodeProps = {
  code: string;
  className?: string;
};

export function CopyInvoiceCode({ code, className }: CopyInvoiceCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3",
        className,
      )}
    >
      <code className="flex-1 break-all font-mono text-base font-semibold tracking-tight text-foreground">
        {code}
      </code>
      <Button type="button" size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => void handleCopy()}>
        {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
        {copied ? "Tersalin" : "Salin kode"}
      </Button>
    </div>
  );
}
