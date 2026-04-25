"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type CustomerOption = {
  id: string;
  name: string;
};

type CustomerComboboxProps = {
  id: string;
  label: string;
  customers: CustomerOption[];
  value: string;
  onValueChange: (customerId: string) => void;
  required?: boolean;
  errorText?: string;
};

export function CustomerCombobox({
  id,
  label,
  customers,
  value,
  onValueChange,
  required,
  errorText,
}: CustomerComboboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = `${id}-listbox`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const selected = useMemo(
    () => customers.find((c) => c.id === value) ?? null,
    [customers, value],
  );

  useEffect(() => {
    setQuery(selected?.name ?? "");
  }, [selected?.name, selected?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return customers;
    }
    return customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [customers, query]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const selectCustomer = useCallback(
    (customer: CustomerOption) => {
      onValueChange(customer.id);
      setQuery(customer.name);
      setOpen(false);
      setHighlightIndex(-1);
    },
    [onValueChange],
  );

  const clearSelection = useCallback(() => {
    onValueChange("");
    setQuery("");
    setOpen(false);
    setHighlightIndex(-1);
  }, [onValueChange]);

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
      }
      if (filtered.length === 0) {
        return;
      }
      setHighlightIndex((i) => {
        if (i < 0) {
          return 0;
        }
        return Math.min(i + 1, filtered.length - 1);
      });
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
      }
      if (filtered.length === 0) {
        return;
      }
      setHighlightIndex((i) => {
        if (i <= 0) {
          return filtered.length - 1;
        }
        return i - 1;
      });
      return;
    }
    if (event.key === "Enter") {
      if (open && highlightIndex >= 0 && filtered[highlightIndex]) {
        event.preventDefault();
        selectCustomer(filtered[highlightIndex]);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setHighlightIndex(-1);
      setQuery(selected?.name ?? "");
      return;
    }
    if (event.key === "Home" && open) {
      event.preventDefault();
      setHighlightIndex(filtered.length > 0 ? 0 : -1);
      return;
    }
    if (event.key === "End" && open) {
      event.preventDefault();
      setHighlightIndex(filtered.length > 0 ? filtered.length - 1 : -1);
      return;
    }
  };

  useEffect(() => {
    if (highlightIndex >= filtered.length) {
      setHighlightIndex(filtered.length > 0 ? filtered.length - 1 : -1);
    }
  }, [filtered.length, highlightIndex]);

  return (
    <div ref={containerRef} className="relative space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <input type="hidden" name="customerId" value={value} />
      <Input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && highlightIndex >= 0 ? `${id}-option-${highlightIndex}` : undefined
        }
        autoComplete="off"
        value={query}
        onChange={(event) => {
          const next = event.target.value;
          const nextTrim = next.trim();
          setQuery(next);
          setOpen(true);
          setHighlightIndex(-1);

          if (!nextTrim) {
            onValueChange("");
            return;
          }

          const exact = customers.find(
            (c) => c.name.toLowerCase() === nextTrim.toLowerCase(),
          );
          if (exact) {
            onValueChange(exact.id);
            return;
          }

          if (value) {
            const current = customers.find((c) => c.id === value);
            if (current) {
              const curLower = current.name.toLowerCase();
              const nextLower = nextTrim.toLowerCase();
              if (curLower === nextLower || curLower.startsWith(nextLower)) {
                return;
              }
            }
            onValueChange("");
          }
        }}
        onFocus={() => {
          setOpen(true);
          setHighlightIndex(-1);
        }}
        onKeyDown={onInputKeyDown}
        className={cn(errorText && "border-destructive aria-invalid:border-destructive")}
        aria-invalid={errorText ? true : undefined}
        aria-required={required}
        placeholder="Ketik nama customer…"
      />
      {errorText ? <p className="text-xs text-destructive">{errorText}</p> : null}
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">No customer found</li>
          ) : (
            filtered.map((customer, index) => (
              <li
                key={customer.id}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={customer.id === value}
                className={cn(
                  "cursor-pointer px-3 py-2 text-sm",
                  index === highlightIndex ? "bg-muted" : "hover:bg-muted/70",
                  customer.id === value && "font-medium",
                )}
                onMouseEnter={() => setHighlightIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectCustomer(customer);
                }}
              >
                {customer.name}
              </li>
            ))
          )}
        </ul>
      ) : null}
      {value ? (
        <button
          type="button"
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          onClick={clearSelection}
        >
          Hapus pilihan
        </button>
      ) : null}
    </div>
  );
}
