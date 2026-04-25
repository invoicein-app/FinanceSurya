import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const CUSTOMER_DUPLICATE_NAME_MESSAGE =
  "Nama customer sudah ada. Gunakan nama lain.";

export type CreateCustomerInput = {
  name: string;
};

export type UpdateCustomerInput = {
  id: string;
  name: string;
};

export async function getCustomers() {
  return prisma.customer.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
  });
}

export async function createCustomer(input: CreateCustomerInput) {
  try {
    return await prisma.customer.create({
      data: {
        name: input.name.trim(),
      },
    });
  } catch (error) {
    throw mapCustomerError(error);
  }
}

export async function updateCustomer(input: UpdateCustomerInput) {
  try {
    return await prisma.customer.update({
      where: { id: input.id },
      data: {
        name: input.name.trim(),
      },
    });
  } catch (error) {
    throw mapCustomerError(error);
  }
}

export async function deleteCustomer(id: string) {
  return prisma.customer.delete({
    where: { id },
  });
}

function mapCustomerError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return new Error(CUSTOMER_DUPLICATE_NAME_MESSAGE);
  }
  return error;
}
