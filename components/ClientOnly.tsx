"use client";

import { useClientMounted } from "@/hooks/useClientMounted";

type ClientOnlyProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const mounted = useClientMounted();
  if (!mounted) return fallback;
  return children;
}