import { LEGAL_POLICY_VERSION } from "@/lib/legalContent";

export type CookieConsentChoice = "accept" | "essential";

export type CookieConsentRecord = {
  choice: CookieConsentChoice;
  version: string;
  acceptedAt: string;
};

export const COOKIE_CONSENT_KEY = "claimguard-cookie-consent";
export const COOKIE_CONSENT_VERSION = LEGAL_POLICY_VERSION;

export function readCookieConsent(): CookieConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentRecord;
    if (!parsed?.choice || !parsed?.acceptedAt) return null;
    if (parsed.version !== COOKIE_CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasCookieConsent() {
  return readCookieConsent() !== null;
}

export function saveCookieConsent(choice: CookieConsentChoice) {
  const record: CookieConsentRecord = {
    choice,
    version: COOKIE_CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
  };
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(record));
  return record;
}

export function allowsAnalyticsCookies() {
  const consent = readCookieConsent();
  return consent?.choice === "accept";
}