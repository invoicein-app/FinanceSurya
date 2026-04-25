import Link from "next/link";

import {
  createCustomerAction,
  deleteCustomerAction,
  updateCustomerAction,
} from "@/app/customers/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCustomers } from "@/lib/services/customer-service";

type CustomersPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;
  const customers = await getCustomers();
  const duplicateName = params.error === "duplicate";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 md:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Master Customer</h1>
        <Button asChild variant="outline">
          <Link href="/">Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tambah Customer</CardTitle>
        </CardHeader>
        <CardContent>
          {duplicateName ? (
            <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Nama customer sudah dipakai. Gunakan nama lain, atau edit customer yang sudah ada di
              tabel bawah.
            </p>
          ) : null}
          <form action={createCustomerAction} className="flex flex-col gap-3 md:flex-row">
            <div className="w-full space-y-2">
              <Label htmlFor="name">Nama Customer</Label>
              <Input id="name" name="name" placeholder="Toko Barokah" required />
            </div>
            <Button type="submit" className="md:self-end">
              Simpan
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    Belum ada customer.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <form action={updateCustomerAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={customer.id} />
                        <Input name="name" defaultValue={customer.name} required />
                        <Button type="submit" size="sm" variant="outline">
                          Update
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={deleteCustomerAction}>
                        <input type="hidden" name="id" value={customer.id} />
                        <Button type="submit" size="sm" variant="destructive">
                          Hapus
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
