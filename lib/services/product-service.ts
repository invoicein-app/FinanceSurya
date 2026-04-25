import { prisma } from "@/lib/prisma";

export type CreateProductInput = {
  code: string;
  name: string;
  category: string;
  size: string;
  unit: string;
  defaultPrice: number;
};

export async function getProducts() {
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createProduct(input: CreateProductInput) {
  return prisma.product.create({
    data: {
      ...input,
      defaultPrice: input.defaultPrice.toString(),
    },
  });
}
