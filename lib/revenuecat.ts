"use client";

import type { CustomerInfo } from "@revenuecat/purchases-js";

export const revenueCatEntitlement = process.env.NEXT_PUBLIC_REVENUECAT_ENTITLEMENT_ID || "pro";

export function isRevenueCatConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_REVENUECAT_WEB_API_KEY);
}

export async function getRevenueCat(appUserId: string, email?: string) {
  const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_WEB_API_KEY;
  if (!apiKey) throw new Error("RevenueCat is not configured.");
  const { Purchases, ReservedCustomerAttribute } = await import("@revenuecat/purchases-js");

  const purchases = Purchases.isConfigured()
    ? Purchases.getSharedInstance()
    : Purchases.configure({ apiKey, appUserId });

  if (purchases.getAppUserId() !== appUserId) await purchases.changeUser(appUserId);
  if (email) {
    await purchases.setAttributes({ [ReservedCustomerAttribute.Email]: email }).catch(() => undefined);
  }

  return purchases;
}

export function summarizeSubscription(customerInfo: CustomerInfo) {
  const entitlement = customerInfo.entitlements.active[revenueCatEntitlement];
  return {
    active: Boolean(entitlement),
    entitlement: entitlement?.identifier || "free",
    product: entitlement?.productIdentifier || null,
    renews: entitlement?.willRenew || false,
    expiresAt: entitlement?.expirationDate || null,
    managementUrl: customerInfo.managementURL,
  };
}
