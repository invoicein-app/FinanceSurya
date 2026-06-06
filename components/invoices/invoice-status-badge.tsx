import type { InvoicePaymentStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import {
  paymentStatusBadgeClass,
  paymentStatusLabel,
} from "@/lib/services/invoice-group-service";
import { cn } from "@/lib/utils";

type InvoiceStatusBadgeProps = {
  status: InvoicePaymentStatus | string;
  className?: string;
};

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(paymentStatusBadgeClass(status), className)}>
      {paymentStatusLabel(status)}
    </Badge>
  );
}
