"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import { deleteCustomerAction, updateCustomerAction } from "@/app/customers/actions";
import { MutationActionForm } from "@/components/mutation-action-form";
import {
  DashboardTableArea,
  TABLE_ACTION_BTN_DELETE,
  TABLE_ACTION_BTN_VIEW,
  TABLE_BODY_ROW_CLASS,
  TABLE_CELL_ACTIONS,
  TABLE_CELL_DEFAULT,
  TABLE_EMPTY_CELL,
  TABLE_HEAD_CLASS,
  TABLE_HEADER_ROW_CLASS,
} from "@/components/layout/app-theme-ui";
import { TableListFooter } from "@/components/layout/table-list-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type CustomerListRow = {
  id: string;
  name: string;
};

type CustomersTableProps = {
  initialRows: CustomerListRow[];
};

export function CustomersTable({ initialRows }: CustomersTableProps) {
  const [rows] = useState(initialRows);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, safePage, pageSize]);

  const rangeStart = rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, rows.length);

  return (
    <>
      <DashboardTableArea>
        <Table>
          <TableHeader>
            <TableRow className={TABLE_HEADER_ROW_CLASS}>
              <TableHead className={TABLE_HEAD_CLASS}>Nama</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "w-[220px] text-right")}>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className={TABLE_EMPTY_CELL}>
                  Belum ada customer.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((customer) => {
                const updateFormId = `update-customer-${customer.id}`;

                return (
                  <TableRow key={customer.id} className={TABLE_BODY_ROW_CLASS}>
                    <TableCell className={TABLE_CELL_DEFAULT}>
                      <MutationActionForm
                        id={updateFormId}
                        action={updateCustomerAction}
                        className="hidden"
                      >
                        <input type="hidden" name="id" value={customer.id} />
                      </MutationActionForm>
                      <Input
                        form={updateFormId}
                        name="name"
                        defaultValue={customer.name}
                        required
                        className="w-full max-w-xl border-[var(--table-border)] bg-background shadow-sm"
                      />
                    </TableCell>
                    <TableCell className={TABLE_CELL_ACTIONS}>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          type="submit"
                          form={updateFormId}
                          size="sm"
                          variant="outline"
                          className={TABLE_ACTION_BTN_VIEW}
                        >
                          Update
                        </Button>
                        <MutationActionForm
                          action={deleteCustomerAction}
                          mutationKind="delete"
                          className="inline-block"
                        >
                          <input type="hidden" name="id" value={customer.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className={TABLE_ACTION_BTN_DELETE}
                          >
                            <Trash2 className="size-3.5" />
                            Hapus
                          </Button>
                        </MutationActionForm>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </DashboardTableArea>

      <TableListFooter
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        total={rows.length}
        entityLabel="customer"
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </>
  );
}
