import type { AuditEvent, ClaimAnalysis, RegulationUpdate, WorkflowTask } from "@/lib/workspaceTypes";

export function readFallback<T>(key: string, seed: T, enabled: boolean): T {
  if (!enabled || typeof window === "undefined") return seed;
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  } catch {
    return seed;
  }
}

export function writeFallback<T>(key: string, value: T, enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function readClaimFallback(): ClaimAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("claimguard-claim-fallback");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function writeClaimFallback(claims: ClaimAnalysis[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("claimguard-claim-fallback", JSON.stringify(claims));
}

export function readRegulationFallback(): RegulationUpdate[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("claimguard-regulation-fallback");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function writeRegulationFallback(updates: RegulationUpdate[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("claimguard-regulation-fallback", JSON.stringify(updates));
}

export function readTaskFallback(): WorkflowTask[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("claimguard-task-fallback");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function writeTaskFallback(tasks: WorkflowTask[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("claimguard-task-fallback", JSON.stringify(tasks));
}

export function readAuditFallback(): AuditEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("claimguard-audit-fallback");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function writeAuditFallback(events: AuditEvent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("claimguard-audit-fallback", JSON.stringify(events));
}