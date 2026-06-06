import { Badge } from "@/components/ui/badge";
import {
  paymentStatusBadgeClass,
  paymentStatusLabel,
  type InvoicePaymentStatusValue,
} from "@/lib/invoice-group-utils";
import { cn } from "@/lib/utils";

type InvoiceStatusBadgeProps = {
  status: InvoicePaymentStatusValue | string;
  className?: string;
};

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(paymentStatusBadgeClass(status), className)}>
      {paymentStatusLabel(status)}
    </Badge>
  );
}
