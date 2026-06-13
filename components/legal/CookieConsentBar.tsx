"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { useClientMounted } from "@/hooks/useClientMounted";
import { hasCookieConsent, saveCookieConsent, type CookieConsentChoice } from "@/lib/cookieConsent";

export function CookieConsentBar() {
  const mounted = useClientMounted();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    setVisible(!hasCookieConsent());
  }, [mounted]);

  const choose = (choice: CookieConsentChoice) => {
    saveCookieConsent(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[80] px-4 pb-4 sm:px-6 sm:pb-6"
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
    >
      <div className="surface mx-auto flex max-w-4xl flex-col gap-4 border-black/10 p-4 shadow-[0_18px_50px_rgba(16,24,45,0.18)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e8faf6] text-[#0f9f8c]">
            <Cookie size={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Cookies on ClaimGuard</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              We use essential cookies to keep you signed in and run the workspace securely.
              Optional analytics are off unless you accept all. Read our{" "}
              <Link href="/cookies" className="font-semibold text-ink underline-offset-2 hover:underline">
                Cookie Policy
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          <button type="button" className="secondary !px-4 !py-2" onClick={() => choose("essential")}>
            Essential only
          </button>
          <button type="button" className="primary !px-4 !py-2" onClick={() => choose("accept")}>
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}