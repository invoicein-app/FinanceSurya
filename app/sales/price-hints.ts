"use server";

import { ensureAuthenticated } from "@/lib/auth/ensure-auth";
import {
  findCustomerLatestPriceByExactItemKey,
  getCustomerItemSuggestions,
  getCustomerPriceListHints,
} from "@/lib/services/customer-price-list-service";
import { getActiveVeneerTemplatesForCustomer } from "@/lib/services/veneer-template-service";

export async function fetchCustomerPriceListHintsAction(customerId: string) {
  if (!customerId) {
    return {} as Record<string, { latestPrice: string }>;
  }
  return getCustomerPriceListHints(customerId);
}

export async function fetchCustomerItemSuggestionsAction(
  customerId: string,
  keyword?: string,
  limit = 8,
) {
  await ensureAuthenticated();
  if (!customerId) {
    return [];
  }
  return getCustomerItemSuggestions({ customerId, keyword, limit });
}

export async function fetchExactCustomerPriceAction(input: {
  customerId: string;
  itemName: string;
  category?: string;
  thickness?: string;
  width?: string;
  length?: string;
  unit?: string;
}) {
  await ensureAuthenticated();
  if (!input.customerId) {
    return null;
  }
  return findCustomerLatestPriceByExactItemKey(input);
}

export async function fetchCustomerVeneerTemplatesAction(customerId: string) {
  await ensureAuthenticated();
  if (!customerId) {
    return [];
  }
  return getActiveVeneerTemplatesForCustomer(customerId);
}
