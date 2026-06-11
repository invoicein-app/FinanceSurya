"use client";

import { AppNavLink } from "@/components/app-nav-link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import {
  fetchCustomerPriceListHintsAction,
  fetchCustomerVeneerTemplatesAction,
} from "@/app/sales/price-hints";
import { buildVeneerItemDescription } from "@/lib/sales/item-description";
import {
  CustomerCombobox,
  type CustomerOption,
} from "@/components/sales/customer-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RupiahInput } from "@/components/ui/rupiah-input";
import { Textarea } from "@/components/ui/textarea";
import { getTodayDateValue } from "@/lib/date-input";
import { useFormSubmitOnce } from "@/lib/hooks/use-form-submit-once";
import { buildSaleItemKey } from "@/lib/item-key";
import {
  parseThicknessMmForStock,
  sanitizeSaleQtyTyping,
  sanitizeThicknessMmTyping,
  thicknessMmMatches,
} from "@/lib/sales/thickness-mm";
import { buildVeneerSpecKey } from "@/lib/sales/veneer-template-spec";
import type { VeneerTemplateRow } from "@/lib/services/veneer-template-service";
import type { ThicknessStockOption } from "@/lib/services/wood-purchase-service";

type ItemSourceRow = {
  id: string;
  /** Alokasi dari penjualan lama (per baris log/kapling) — tidak bisa dihapus dari form. */
  isLegacy: boolean;
  /** WoodPurchase.id — sumber partai (ketebalan & qty dari kolom item). */
  woodPurchaseId: string;
  /** Hanya riwayat / payload lama */
  thicknessStockId: string;
  purchaseItemId: string;
  legacyLabel?: string;
  qtyTaken: string;
  volumeTaken: string;
  costAmount: string;
};

type ItemRow = {
  id: string;
  templateId?: string;
  itemName?: string;
  category: string;
  thickness: string;
  width: string;
  length: string;
  unit: string;
  qty: string;
  price: string;
  note: string;
  sources: ItemSourceRow[];
};

type SaleFormValues = {
  saleDate: string;
  customerId: string;
  note: string;
  items: ItemRow[];
};

type SaleFormProps = {
  customers: CustomerOption[];
  thicknessStockOptions: ThicknessStockOption[];
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  initialValues?: SaleFormValues;
};

/** Selaras dengan stok partai per ketebalan (DEFAULT_THICKNESS_STOCK_UNIT). */
const DEFAULT_SALE_ITEM_UNIT = "m2";

const defaultRow = (): ItemRow => ({
  id: crypto.randomUUID(),
  templateId: "",
  itemName: "",
  category: "",
  thickness: "",
  width: "",
  length: "",
  unit: DEFAULT_SALE_ITEM_UNIT,
  qty: "1",
  price: "0",
  note: "",
  sources: [
    {
      id: crypto.randomUUID(),
      isLegacy: false,
      woodPurchaseId: "",
      thicknessStockId: "",
      purchaseItemId: "",
      qtyTaken: "0",
      volumeTaken: "0",
      costAmount: "0",
    },
  ],
});

export function SaleForm({
  customers,
  thicknessStockOptions,
  action,
  submitLabel,
  initialValues,
}: SaleFormProps) {
  const isCreateMode = !initialValues;
  const [clientRequestId] = useState(() => crypto.randomUUID());
  const [saleDate, setSaleDate] = useState(
    initialValues?.saleDate ?? getTodayDateValue(),
  );
  const [customerId, setCustomerId] = useState(initialValues?.customerId ?? "");
  const [customerFieldError, setCustomerFieldError] = useState<string | undefined>();
  const [saleNote, setSaleNote] = useState(initialValues?.note ?? "");
  const [items, setItems] = useState<ItemRow[]>([
    ...(initialValues?.items.length ? initialValues.items : [defaultRow()]),
  ]);
  const [priceListHints, setPriceListHints] = useState<
    Record<string, { latestPrice: string }>
  >({});
  const [customerTemplates, setCustomerTemplates] = useState<VeneerTemplateRow[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [allocationError, setAllocationError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | undefined>();
  const editTemplateMatchedRef = useRef(false);
  const initialCustomerIdRef = useRef(initialValues?.customerId ?? "");

  const partaiOptions = useMemo(() => {
    const map = new Map<string, { id: string; partaiLabel: string }>();
    for (const row of thicknessStockOptions) {
      if (!map.has(row.purchaseId)) {
        map.set(row.purchaseId, { id: row.purchaseId, partaiLabel: row.partaiLabel });
      }
    }
    return [...map.values()];
  }, [thicknessStockOptions]);

  const templateById = useMemo(() => {
    const map = new Map<string, VeneerTemplateRow>();
    for (const tpl of customerTemplates) {
      map.set(tpl.id, tpl);
    }
    return map;
  }, [customerTemplates]);

  useEffect(() => {
    let cancelled = false;
    if (!customerId) {
      setCustomerTemplates([]);
      setTemplatesLoading(false);
      return;
    }

    setTemplatesLoading(true);
    void fetchCustomerVeneerTemplatesAction(customerId).then((data) => {
      if (!cancelled) {
        setCustomerTemplates(data);
        setTemplatesLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  useEffect(() => {
    let cancelled = false;
    if (!customerId) {
      return;
    }
    void fetchCustomerPriceListHintsAction(customerId).then((data) => {
      if (!cancelled) {
        setPriceListHints(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  useEffect(() => {
    if (!customerId || customerTemplates.length === 0) {
      return;
    }

    const validIds = new Set(customerTemplates.map((tpl) => tpl.id));
    setItems((current) =>
      current.map((item) => {
        if (item.templateId && validIds.has(item.templateId)) {
          return item;
        }
        if (item.templateId && !validIds.has(item.templateId)) {
          return { ...item, templateId: "" };
        }
        return item;
      }),
    );
  }, [customerId, customerTemplates]);

  useEffect(() => {
    if (
      !customerId ||
      customerTemplates.length === 0 ||
      editTemplateMatchedRef.current ||
      customerId !== initialCustomerIdRef.current
    ) {
      return;
    }

    setItems((current) =>
      current.map((item) => {
        if (item.templateId) {
          return item;
        }
        const specKey = buildVeneerSpecKey({
          thickness: item.thickness,
          width: item.width,
          length: item.length,
          grade: item.category,
          unit: item.unit,
        });
        const matched = customerTemplates.find((tpl) => tpl.specKey === specKey);
        return matched ? { ...item, templateId: matched.id } : item;
      }),
    );
    editTemplateMatchedRef.current = true;
  }, [customerId, customerTemplates]);

  const hintsForDisplay = useMemo(
    () => (customerId ? priceListHints : {}),
    [customerId, priceListHints],
  );

  const estimatedTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = Number(item.qty);
      const price = Number(item.price);
      if (qty <= 0 || price <= 0) {
        return sum;
      }
      return sum + qty * price;
    }, 0);
  }, [items]);

  const serializedItemsPayload = useMemo(() => {
    return JSON.stringify(
      items.map((item) => ({
        itemName: buildVeneerItemDescription({
          thickness: item.thickness,
          width: item.width,
          length: item.length,
          mutu: item.category,
        }),
        category: item.category ? String(item.category) : undefined,
        thickness: item.thickness ? String(item.thickness) : undefined,
        width: item.width ? String(item.width) : undefined,
        length: item.length ? String(item.length) : undefined,
        unit: item.unit ? String(item.unit) : undefined,
        qty: Number(item.qty || 0),
        price: Number(item.price || 0),
        note: item.note ? String(item.note) : undefined,
        sources: item.sources.flatMap<
          | {
              purchaseItemId: string;
              qtyTaken: number;
              volumeTaken: number;
              costAmount: number;
            }
          | { woodPurchaseId: string }
        >((source) => {
          if (source.isLegacy) {
            const qtyTaken = Number(source.qtyTaken || 0);
            const volumeTaken = Number(source.volumeTaken || 0);
            if (!source.purchaseItemId || (qtyTaken <= 0 && volumeTaken <= 0)) {
              return [];
            }
            return [
              {
                purchaseItemId: source.purchaseItemId,
                qtyTaken,
                volumeTaken,
                costAmount: Number(source.costAmount || 0),
              },
            ];
          }
          if (source.woodPurchaseId) {
            return [{ woodPurchaseId: source.woodPurchaseId }];
          }
          return [];
        }),
      })),
    );
  }, [items]);

  const addItem = () => {
    const row = defaultRow();
    setItems((current) => [...current, row]);
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const updateItem = (
    id: string,
    key: Exclude<keyof ItemRow, "sources">,
    value: string,
  ) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]: value,
              templateId:
                key === "thickness" ||
                key === "width" ||
                key === "length" ||
                key === "category" ||
                key === "unit"
                  ? ""
                  : item.templateId,
            }
          : item,
      ),
    );
  };

  const applyTemplateToItem = (itemId: string, templateId: string) => {
    if (!customerId) {
      return;
    }

    if (!templateId) {
      setItems((current) =>
        current.map((item) => (item.id === itemId ? { ...item, templateId: "" } : item)),
      );
      return;
    }

    const template = templateById.get(templateId);
    if (!template || template.customerId !== customerId) {
      setItems((current) =>
        current.map((item) => (item.id === itemId ? { ...item, templateId: "" } : item)),
      );
      return;
    }

    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) {
          return item;
        }
        const nextThickness = template.thickness ?? "";
        const nextWidth = template.width ?? "";
        const nextLength = template.length ?? "";
        const nextGrade = template.grade ?? "";
        const nextUnit = template.unit?.trim() || DEFAULT_SALE_ITEM_UNIT;

        const nextDescription = buildVeneerItemDescription({
          thickness: nextThickness,
          width: nextWidth,
          length: nextLength,
          mutu: nextGrade,
        });
        const itemKey = buildSaleItemKey({
          itemName: nextDescription,
          category: nextGrade || undefined,
          thickness: nextThickness || undefined,
          width: nextWidth || undefined,
          length: nextLength || undefined,
          unit: nextUnit || undefined,
        });
        const latestCustomerPrice = customerId
          ? hintsForDisplay[itemKey]?.latestPrice
          : undefined;

        return {
          ...item,
          templateId,
          thickness: nextThickness,
          width: nextWidth,
          length: nextLength,
          category: nextGrade,
          unit: nextUnit,
          price: latestCustomerPrice ?? template.defaultPrice ?? item.price,
        };
      }),
    );
  };

  const updateSource = (
    itemId: string,
    sourceId: string,
    key: keyof ItemSourceRow,
    value: string,
  ) => {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              sources: item.sources.map((source) =>
                source.id === sourceId ? { ...source, [key]: value } : source,
              ),
            }
          : item,
      ),
    );
  };

  const onCustomerChange = (value: string) => {
    setCustomerId(value);
    setCustomerFieldError(undefined);
    setAllocationError(undefined);
    setSubmitError(undefined);
    setPriceListHints({});
    setCustomerTemplates([]);
    editTemplateMatchedRef.current = false;
    setItems((current) =>
      current.map((item) => ({
        ...item,
        templateId: "",
      })),
    );
  };

  const validateBeforeSubmit = useCallback(
    (_event: FormEvent<HTMLFormElement>) => {
      if (!customerId) {
        setCustomerFieldError("Pilih customer terlebih dahulu.");
        return false;
      }

      const allocationProblems: string[] = [];
      for (const item of items) {
        const itemLabel = buildVeneerItemDescription({
          thickness: item.thickness,
          width: item.width,
          length: item.length,
          mutu: item.category,
        });
        if (item.sources.some((s) => s.isLegacy)) {
          continue;
        }
        const partaiId = item.sources.find((s) => !s.isLegacy)?.woodPurchaseId;
        if (!partaiId) {
          continue;
        }
        const mm = parseThicknessMmForStock(item.thickness);
        if (!mm) {
          allocationProblems.push(
            `Item "${itemLabel}": isi Tebal (mm) agar stok partai bisa dikurangi.`,
          );
          continue;
        }
        const stockRow = thicknessStockOptions.find(
          (o) => o.purchaseId === partaiId && thicknessMmMatches(o.thicknessMm, mm),
        );
        if (!stockRow) {
          allocationProblems.push(
            `Item "${itemLabel}": partai yang dipilih tidak punya stok untuk ketebalan ${mm} mm.`,
          );
          continue;
        }
        // Stok partai boleh minus setelah penjualan; tidak memblok submit di sini.
      }

      if (allocationProblems.length > 0) {
        setAllocationError(allocationProblems.join(" "));
        return false;
      }

      setAllocationError(undefined);
      return true;
    },
    [customerId, items, thicknessStockOptions],
  );

  const { isSubmitting, submittingLabel, handleSubmit: handleFormSubmit } =
    useFormSubmitOnce({
      action,
      beforeSubmit: validateBeforeSubmit,
      onError: (error) => {
        if (error instanceof Error) {
          setSubmitError(error.message);
          return;
        }
        setSubmitError("Gagal menyimpan transaksi. Periksa data lalu coba lagi.");
      },
    });

  const tryAutoFillExactPrice = (itemId: string) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId || !customerId) {
          return item;
        }
        const itemDescription = buildVeneerItemDescription({
          thickness: item.thickness,
          width: item.width,
          length: item.length,
          mutu: item.category,
        });

        const itemKey = buildSaleItemKey({
          itemName: itemDescription,
          category: item.category || undefined,
          thickness: item.thickness || undefined,
          width: item.width || undefined,
          length: item.length || undefined,
          unit: item.unit || undefined,
        });
        const exactPrice = hintsForDisplay[itemKey]?.latestPrice;
        if (!exactPrice) {
          return item;
        }

        const currentPrice = Number(item.price || 0);
        if (currentPrice > 0) {
          return item;
        }

        return { ...item, price: exactPrice };
      }),
    );
  };

  return (
    <form className="space-y-6" onSubmit={handleFormSubmit}>
      {isCreateMode ? (
        <input type="hidden" name="clientRequestId" value={clientRequestId} />
      ) : null}
      <input type="hidden" name="itemsPayload" value={serializedItemsPayload} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="saleDate">Tanggal Penjualan</Label>
          <Input
            id="saleDate"
            name="saleDate"
            type="date"
            value={saleDate}
            onChange={(event) => setSaleDate(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <CustomerCombobox
            id="customerId"
            label="Customer"
            customers={customers}
            value={customerId}
            onValueChange={onCustomerChange}
            required
            errorText={customerFieldError}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="note">Catatan</Label>
          <Textarea
            id="note"
            name="note"
            placeholder="Catatan tambahan transaksi..."
            value={saleNote}
            onChange={(event) => setSaleNote(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Item Penjualan dan Alokasi Sumber Partai</h3>
          <Button type="button" variant="outline" onClick={addItem}>
            Tambah Item
          </Button>
        </div>

        {items.map((item, index) => {
          const hasLegacySources = item.sources.some((s) => s.isLegacy);
          const legacyQtySum = item.sources
            .filter((s) => s.isLegacy)
            .reduce((sum, s) => sum + Number(s.qtyTaken || 0), 0);
          const sourceVolumeTotal = item.sources.reduce(
            (sum, source) =>
              source.isLegacy ? sum + Number(source.volumeTaken || 0) : sum,
            0,
          );
          const hasPartaiNew = item.sources.some((s) => !s.isLegacy && s.woodPurchaseId);
          const qtyMismatch =
            hasLegacySources && Math.abs(Number(item.qty || 0) - legacyQtySum) > 1e-6;
          const itemDescription = buildVeneerItemDescription({
            thickness: item.thickness,
            width: item.width,
            length: item.length,
            mutu: item.category,
          });

          const itemKey = buildSaleItemKey({
            itemName: itemDescription,
            category: item.category || undefined,
            thickness: item.thickness || undefined,
            width: item.width || undefined,
            length: item.length || undefined,
            unit: item.unit || undefined,
          });
          const priceHint = hintsForDisplay[itemKey];

          return (
            <div key={item.id} className="space-y-3 rounded-lg border p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
                <div className="flex min-w-0 flex-col gap-2 lg:col-span-3">
                  <Label>Template Barang</Label>
                  <select
                    className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
                    value={item.templateId ?? ""}
                    disabled={!customerId || templatesLoading}
                    onChange={(event) => applyTemplateToItem(item.id, event.target.value)}
                  >
                    {!customerId ? (
                      <option value="">Pilih customer terlebih dahulu</option>
                    ) : templatesLoading ? (
                      <option value="">Memuat template...</option>
                    ) : customerTemplates.length === 0 ? (
                      <option value="">Belum ada template untuk customer ini</option>
                    ) : (
                      <>
                        <option value="">Pilih template atau isi spesifikasi manual</option>
                        {customerTemplates.map((tpl) => (
                          <option key={tpl.id} value={tpl.id}>
                            {tpl.templateName}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                <div className="flex min-w-0 flex-col gap-2 lg:col-span-4">
                  <Label>Deskripsi Item (otomatis)</Label>
                  <Input value={itemDescription} disabled />
                </div>
                <div className="flex min-w-0 flex-col gap-2 lg:col-span-2">
                  <Label>Qty *</Label>
                  <Input
                    value={item.qty}
                    inputMode="decimal"
                    autoComplete="off"
                    onChange={(event) =>
                      updateItem(item.id, "qty", sanitizeSaleQtyTyping(event.target.value))
                    }
                    onKeyDown={(e) => {
                      if (e.key === ",") {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Mis. 50.35 (titik)"
                    required
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-2 lg:col-span-3">
                  <Label htmlFor={`sale-finance-price-${item.id}`}>
                    Harga Penjualan Finance *
                  </Label>
                  <RupiahInput
                    id={`sale-finance-price-${item.id}`}
                    value={item.price}
                    onValueChange={(numericString) =>
                      updateItem(item.id, "price", numericString)
                    }
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {customerId
                  ? "Template per customer — dari tabel VeneerTemplate (tersinkron dari histori harga)."
                  : "Pilih customer untuk melihat template miliknya."}
              </p>
              {priceHint ? (
                <p className="text-xs text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                    Harga terakhir customer ini
                  </span>{" "}
                  Rp {Number(priceHint.latestPrice).toLocaleString("id-ID")}
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 align-baseline text-xs"
                    onClick={() => updateItem(item.id, "price", priceHint.latestPrice)}
                  >
                    Terapkan
                  </Button>
                </p>
              ) : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
                <div className="flex min-w-0 flex-col gap-2 lg:col-span-3">
                  <Label>Subtotal</Label>
                  <Input
                    value={(
                      Number(item.qty || 0) * Number(item.price || 0)
                    ).toLocaleString("id-ID")}
                    disabled
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-2 sm:col-span-2 lg:col-span-3 lg:col-start-10">
                  <Label className="hidden lg:block lg:invisible" aria-hidden="true">
                    Aksi
                  </Label>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                  >
                    Hapus Item
                  </Button>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs text-muted-foreground">
                  Spesifikasi (opsional) dipakai untuk mengelompokkan item yang sama — mempengaruhi
                  referensi harga per customer.
                </p>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-10 lg:items-end">
                  <div className="flex min-w-0 flex-col gap-2 lg:col-span-2">
                    <Label>Mutu</Label>
                    <Input
                        value={item.category}
                        onChange={(event) =>
                          updateItem(item.id, "category", event.target.value)
                        }
                        onBlur={() => tryAutoFillExactPrice(item.id)}
                        placeholder="A/B/C (opsional)"
                      />
                  </div>
                  <div className="flex min-w-0 flex-col gap-2 lg:col-span-2">
                    <Label>Tebal (mm)</Label>
                    <Input
                        value={item.thickness}
                        inputMode="decimal"
                        autoComplete="off"
                        onChange={(event) =>
                          updateItem(
                            item.id,
                            "thickness",
                            sanitizeThicknessMmTyping(event.target.value),
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === ",") {
                            e.preventDefault();
                          }
                        }}
                        onBlur={() => tryAutoFillExactPrice(item.id)}
                        placeholder="Mis. 0.6 (titik)"
                      />
                  </div>
                  <div className="flex min-w-0 flex-col gap-2 lg:col-span-2">
                    <Label>Lebar</Label>
                    <Input
                        value={item.width}
                        onChange={(event) => updateItem(item.id, "width", event.target.value)}
                        onBlur={() => tryAutoFillExactPrice(item.id)}
                        placeholder="Opsional"
                      />
                  </div>
                  <div className="flex min-w-0 flex-col gap-2 lg:col-span-2">
                    <Label>Panjang</Label>
                    <Input
                        value={item.length}
                        onChange={(event) =>
                          updateItem(item.id, "length", event.target.value)
                        }
                        onBlur={() => tryAutoFillExactPrice(item.id)}
                        placeholder="Opsional"
                      />
                  </div>
                  <div className="flex min-w-0 flex-col gap-2 lg:col-span-2">
                    <Label>Satuan</Label>
                    <Input
                        value={item.unit}
                        onChange={(event) => updateItem(item.id, "unit", event.target.value)}
                        onBlur={() => tryAutoFillExactPrice(item.id)}
                        placeholder="m2"
                      />
                  </div>
                </div>
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <Label>Catatan Item</Label>
                <Input
                  value={item.note}
                  onChange={(event) => updateItem(item.id, "note", event.target.value)}
                  placeholder="Catatan item penjualan"
                />
              </div>

              <div className="space-y-3 rounded-md border border-dashed p-3">
                <h4 className="text-xs font-medium uppercase text-muted-foreground">
                  Sumber Partai
                </h4>
                <p className="text-xs text-muted-foreground">
                  Pilih satu partai. Pengurangan stok memakai <strong>Tebal</strong> dan{" "}
                  <strong>Qty</strong> pada item (tidak perlu diinput ulang di sini).
                </p>

                {item.sources
                  .filter((s) => s.isLegacy)
                  .map((source) => (
                    <div key={source.id} className="grid gap-3 md:grid-cols-12">
                      <div className="md:col-span-8 space-y-1">
                        <Label>Alokasi lama (log/kapling)</Label>
                        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                          {source.legacyLabel ?? "Riwayat alokasi lama"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Riwayat transaksi lama. Untuk alokasi model baru, buat item penjualan baru
                          tanpa baris log ini.
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <Label>Qty (lama)</Label>
                        <Input type="number" value={source.qtyTaken} disabled />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Vol (lama)</Label>
                        <Input type="number" value={source.volumeTaken} disabled />
                      </div>
                    </div>
                  ))}

                {!item.sources.some((s) => s.isLegacy) ? (
                  <>
                    {partaiOptions.length === 0 ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
                        <p className="font-medium">Belum ada partai dengan stok ketebalan</p>
                        <p className="mt-1 text-xs leading-relaxed">
                          Buka{" "}
                          <AppNavLink href="/purchases" className="underline font-medium">
                            Partai pembelian
                          </AppNavLink>{" "}
                          dan pastikan tiap partai punya baris stok (default 0,6 &amp; 1,2 mm), lalu
                          refresh halaman ini.
                        </p>
                      </div>
                    ) : null}

                    {item.sources
                      .filter((s) => !s.isLegacy)
                      .map((source) => {
                        const mm = parseThicknessMmForStock(item.thickness);
                        const stockForItem =
                          mm && source.woodPurchaseId
                            ? thicknessStockOptions.find(
                                (o) =>
                                  o.purchaseId === source.woodPurchaseId &&
                                  thicknessMmMatches(o.thicknessMm, mm),
                              )
                            : null;
                        const qtyNum = Number(item.qty || 0);
                        const after =
                          stockForItem != null
                            ? stockForItem.qtyAvailableEffective - qtyNum
                            : null;

                        return (
                          <div key={source.id} className="grid gap-3 md:grid-cols-12">
                            <div className="md:col-span-5">
                              <Label>Sumber Partai</Label>
                              <select
                                className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                                value={source.woodPurchaseId}
                                disabled={partaiOptions.length === 0}
                                onChange={(event) =>
                                  updateSource(
                                    item.id,
                                    source.id,
                                    "woodPurchaseId",
                                    event.target.value,
                                  )
                                }
                              >
                                <option value="">-- Pilih partai --</option>
                                {partaiOptions.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.partaiLabel}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="md:col-span-7 space-y-1 text-xs text-muted-foreground">
                              <p>
                                <span className="font-medium text-foreground">Tebal item:</span>{" "}
                                {item.thickness?.trim() ? item.thickness : "—"}{" "}
                                {mm ? (
                                  <span className="text-foreground">mm</span>
                                ) : (
                                  <span className="text-amber-600">(isi kolom Tebal)</span>
                                )}
                              </p>
                              <p>
                                <span className="font-medium text-foreground">Qty item:</span>{" "}
                                {qtyNum.toLocaleString("id-ID")}
                              </p>
                              {stockForItem ? (
                                <>
                                  <p>
                                    <span className="font-medium text-foreground">
                                      Stok partai untuk tebal ini:
                                    </span>{" "}
                                    {stockForItem.qtyAvailableEffective.toLocaleString("id-ID")}
                                    {stockForItem.unit ? ` ${stockForItem.unit}` : ""}
                                  </p>
                                  <p>
                                    <span className="font-medium text-foreground">
                                      Sisa setelah transaksi (simulasi):
                                    </span>{" "}
                                    {(after ?? 0).toLocaleString("id-ID")}
                                  </p>
                                </>
                              ) : source.woodPurchaseId && mm ? (
                                <p className="text-amber-600">
                                  Partai ini tidak punya baris stok untuk ketebalan {mm} mm.
                                </p>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                  </>
                ) : null}
              </div>

              <div className="text-xs text-muted-foreground">
                {hasPartaiNew && !hasLegacySources ? (
                  <p>
                    Stok partai berkurang sebesar qty item untuk ketebalan sesuai kolom Tebal. Sisa stok
                    boleh ditampilkan minus jika qty melebihi stok tercatat (penjualan diperbolehkan).
                  </p>
                ) : null}
                {hasLegacySources && sourceVolumeTotal > 0 ? (
                  <p className="inline">
                    Total volume (alokasi lama):{" "}
                    {sourceVolumeTotal.toLocaleString("id-ID")}
                  </p>
                ) : null}
                {qtyMismatch && (
                  <span className="ml-2 text-amber-600">
                    Peringatan: qty item tidak sama dengan total qty alokasi log lama.
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Subtotal item {index + 1}: Rp{" "}
                {(Number(item.qty || 0) * Number(item.price || 0)).toLocaleString("id-ID")}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Estimasi Grand Total</p>
        <p className="text-lg font-semibold">
          Rp {estimatedTotal.toLocaleString("id-ID")}
        </p>
      </div>

      {allocationError ? (
        <p className="text-sm text-destructive">{allocationError}</p>
      ) : null}

      {submitError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}
