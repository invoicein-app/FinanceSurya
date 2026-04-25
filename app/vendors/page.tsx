import Link from "next/link";

import {
  createVendorAction,
  deleteVendorAction,
  updateVendorAction,
} from "@/app/vendors/actions";
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
import { getVendors } from "@/lib/services/vendor-service";

export default async function VendorsPage() {
  const vendors = await getVendors();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 md:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Master Vendor</h1>
        <Button asChild variant="outline">
          <Link href="/">Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tambah Vendor</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createVendorAction} className="flex flex-col gap-3 md:flex-row">
            <div className="w-full space-y-2">
              <Label htmlFor="name">Nama Vendor</Label>
              <Input id="name" name="name" placeholder="PT Kayu Nusantara" required />
            </div>
            <Button type="submit" className="md:self-end">
              Simpan
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Vendor</CardTitle>
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
              {vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    Belum ada vendor.
                  </TableCell>
                </TableRow>
              ) : (
                vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <form action={updateVendorAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={vendor.id} />
                        <Input name="name" defaultValue={vendor.name} required />
                        <Button type="submit" size="sm" variant="outline">
                          Update
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={deleteVendorAction}>
                        <input type="hidden" name="id" value={vendor.id} />
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
