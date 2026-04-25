import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CreateVendorInput = {
  name: string;
};

export type UpdateVendorInput = {
  id: string;
  name: string;
};

export async function getVendors() {
  return prisma.vendor.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createVendor(input: CreateVendorInput) {
  try {
    return await prisma.vendor.create({
      data: {
        name: input.name.trim(),
      },
    });
  } catch (error) {
    throw mapVendorError(error);
  }
}

export async function updateVendor(input: UpdateVendorInput) {
  try {
    return await prisma.vendor.update({
      where: { id: input.id },
      data: {
        name: input.name.trim(),
      },
    });
  } catch (error) {
    throw mapVendorError(error);
  }
}

export async function deleteVendor(id: string) {
  return prisma.vendor.delete({
    where: { id },
  });
}

function mapVendorError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return new Error("Nama vendor sudah ada. Gunakan nama lain.");
  }
  return error;
}
