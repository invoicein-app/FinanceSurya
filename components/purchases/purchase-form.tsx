"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useFormSubmitOnce } from "@/lib/hooks/use-form-submit-once";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type VendorOption = {
  id: string;
  name: string;
};

type PurchaseItemRow = {
  rowId: string;
  itemId: string;
  woodType: string;
  length: string;
  diameter: string;
  volume: string;
  mutu: string;
  note: string;
};

type PurchaseFormValues = {
  vendorId: string;
  purchaseDate: string;
  batchCode: string;
  documentNumber: string;
  note: string;
  bpCost: number;
  cuttingCost: number;
  shippingCost: number;
  woodPrice: number;
  items: PurchaseItemRow[];
};

type PurchaseFormProps = {
  vendors: VendorOption[];
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  initialValues?: PurchaseFormValues;
};

const defaultRow = (): PurchaseItemRow => ({
  rowId: crypto.randomUUID(),
  itemId: "",
  woodType: "",
  length: "",
  diameter: "",
  volume: "0",
  mutu: "",
  note: "",
});

function parseRupiahInput(value: string) {
  const digitsOnly = value.replace(/[^\d]/g, "");
  if (!digitsOnly) {
    return 0;
  }
  return Number(digitsOnly);
}

function formatRupiahInput(value: number) {
  return value.toLocaleString("id-ID");
}

export function PurchaseForm({
  vendors,
  action,
  submitLabel,
  initialValues,
}: PurchaseFormProps) {
  const [vendorId, setVendorId] = useState(initialValues?.vendorId ?? "");
  const [purchaseDate, setPurchaseDate] = useState(initialValues?.purchaseDate ?? "");
  const [batchCode, setBatchCode] = useState(initialValues?.batchCode ?? "");
  const [documentNumber, setDocumentNumber] = useState(
    initialValues?.documentNumber ?? "",
  );
  const [note, setNote] = useState(initialValues?.note ?? "");
  const [bpCost, setBpCost] = useState(initialValues?.bpCost ?? 0);
  const [cuttingCost, setCuttingCost] = useState(initialValues?.cuttingCost ?? 0);
  const [shippingCost, setShippingCost] = useState(initialValues?.shippingCost ?? 0);
  const [woodPrice, setWoodPrice] = useState(initialValues?.woodPrice ?? 0);
  const [items, setItems] = useState<PurchaseItemRow[]>(
    initialValues?.items.length ? initialValues.items : [defaultRow()],
  );

  const totalVolumeItem = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.volume || 0), 0),
    [items],
  );
  const grandTotal = useMemo(
    () => bpCost + cuttingCost + shippingCost + woodPrice,
    [bpCost, cuttingCost, shippingCost, woodPrice],
  );

  const addItem = () => {
    setItems((current) => [...current, defaultRow()]);
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.rowId !== id));
  };

  const updateItem = (id: string, key: keyof PurchaseItemRow, value: string) => {
    setItems((current) =>
      current.map((item) => (item.rowId === id ? { ...item, [key]: value } : item)),
    );
  };

  const { isSubmitting, submittingLabel, handleSubmit } = useFormSubmitOnce({ action });

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vendorId">Vendor</Label>
          <select
            id="vendorId"
            name="vendorId"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={vendorId}
            onChange={(event) => setVendorId(event.target.value)}
            required
          >
            <option value="">-- Pilih Vendor --</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchaseDate">Tanggal Pembelian</Label>
          <Input
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            value={purchaseDate}
            onChange={(event) => setPurchaseDate(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="batchCode">Kode Partai / Truk</Label>
          <Input
            id="batchCode"
            name="batchCode"
            value={batchCode}
            onChange={(event) => setBatchCode(event.target.value)}
            placeholder="TRUK-001-APR26"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="documentNumber">Nomor Dokumen</Label>
          <Input
            id="documentNumber"
            name="documentNumber"
            value={documentNumber}
            onChange={(event) => setDocumentNumber(event.target.value)}
            placeholder="SJ-0001"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="note">Catatan Header</Label>
          <Textarea
            id="note"
            name="note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="bpCostDisplay">BP Cost (Rp)</Label>
          <Input
            id="bpCostDisplay"
            inputMode="numeric"
            value={formatRupiahInput(bpCost)}
            onChange={(event) => setBpCost(parseRupiahInput(event.target.value))}
          />
          <input type="hidden" name="bpCost" value={bpCost} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cuttingCostDisplay">Cutting Cost (Rp)</Label>
          <Input
            id="cuttingCostDisplay"
            inputMode="numeric"
            value={formatRupiahInput(cuttingCost)}
            onChange={(event) => setCuttingCost(parseRupiahInput(event.target.value))}
          />
          <input type="hidden" name="cuttingCost" value={cuttingCost} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shippingCostDisplay">Shipping Cost (Rp)</Label>
          <Input
            id="shippingCostDisplay"
            inputMode="numeric"
            value={formatRupiahInput(shippingCost)}
            onChange={(event) => setShippingCost(parseRupiahInput(event.target.value))}
          />
          <input type="hidden" name="shippingCost" value={shippingCost} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="woodPriceDisplay">Harga Kayu (Rp)</Label>
          <Input
            id="woodPriceDisplay"
            inputMode="numeric"
            value={formatRupiahInput(woodPrice)}
            onChange={(event) => setWoodPrice(parseRupiahInput(event.target.value))}
          />
          <input type="hidden" name="woodPrice" value={woodPrice} />
        </div>
      </div>

      <div className="grid gap-4 md:max-w-md">
        <div className="space-y-2">
          <Label>Grand Total</Label>
          <Input
            value={`Rp ${grandTotal.toLocaleString("id-ID")}`}
            disabled
          />
          <input type="hidden" name="grandTotal" value={grandTotal} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Item Kayu dalam Partai</h3>
          <Button type="button" variant="outline" onClick={addItem}>
            Tambah Item
          </Button>
        </div>

        {items.map((item) => (
          <div key={item.rowId} className="grid gap-3 rounded-lg border p-3 md:grid-cols-12">
            <input type="hidden" name="itemId" value={item.itemId} />
            <div className="md:col-span-3">
              <Label>Jenis Kayu</Label>
              <Input
                name="woodType"
                value={item.woodType}
                onChange={(event) => updateItem(item.rowId, "woodType", event.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label>Panjang</Label>
              <Input
                name="length"
                type="number"
                min={0}
                step="0.01"
                value={item.length}
                onChange={(event) => updateItem(item.rowId, "length", event.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Diameter</Label>
              <Input
                name="diameter"
                type="number"
                min={0}
                step="0.01"
                value={item.diameter}
                onChange={(event) => updateItem(item.rowId, "diameter", event.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Volume</Label>
              <Input
                name="volume"
                type="number"
                min={0}
                step="0.001"
                value={item.volume}
                onChange={(event) => updateItem(item.rowId, "volume", event.target.value)}
              />
            </div>

            <div className="md:col-span-1">
              <Label>MUTU</Label>
              <Input
                name="mutu"
                type="text"
                value={item.mutu}
                onChange={(event) => updateItem(item.rowId, "mutu", event.target.value)}
                placeholder="A / B / C"
              />
            </div>
            <div className="md:col-span-5">
              <Label>Catatan Item</Label>
              <Input
                name="itemNote"
                value={item.note}
                onChange={(event) => updateItem(item.rowId, "note", event.target.value)}
              />
            </div>
            <div className="md:col-span-2 md:self-end">
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={() => removeItem(item.rowId)}
                disabled={items.length === 1}
              >
                Hapus
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        Total volume item:{" "}
        <span className="font-medium">{totalVolumeItem.toLocaleString("id-ID")}</span>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}
