export type InvoicePaymentStatusValue = "unpaid" | "partial" | "paid";

export function computePaymentStatus(
  paidAmount: number,
  totalAmount: number,
): InvoicePaymentStatusValue {
  if (totalAmount <= 0) {
    return paidAmount > 0 ? "paid" : "unpaid";
  }
  if (paidAmount <= 0) {
    return "unpaid";
  }
  if (paidAmount >= totalAmount) {
    return "paid";
  }
  return "partial";
}

export function paymentStatusLabel(status: InvoicePaymentStatusValue | string): string {
  switch (status) {
    case "paid":
      return "Lunas";
    case "partial":
      return "Partial";
    default:
      return "Belum lunas";
  }
}

export function paymentStatusBadgeClass(status: string): string {
  switch (status) {
    case "paid":
      return "border-primary/25 bg-primary/10 text-primary";
    case "partial":
      return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
    default:
      return "border-destructive/25 bg-destructive/10 text-destructive";
  }
}
