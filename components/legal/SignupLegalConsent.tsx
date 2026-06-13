import Link from "next/link";

type SignupLegalConsentProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function SignupLegalConsent({ checked, onChange }: SignupLegalConsentProps) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-black/[.08] bg-stone/40 px-4 py-3 text-sm leading-6 text-muted">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 shrink-0 rounded border-black/20"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        I agree to the{" "}
        <Link href="/terms" className="font-semibold text-ink underline-offset-2 hover:underline" target="_blank">Terms of Service</Link>
        {" "}and{" "}
        <Link href="/privacy" className="font-semibold text-ink underline-offset-2 hover:underline" target="_blank">Privacy Policy</Link>
        , and I understand ClaimGuard provides{" "}
        <Link href="/disclaimer" className="font-semibold text-ink underline-offset-2 hover:underline" target="_blank">educational guidance only</Link>
        , not legal advice.
      </span>
    </label>
  );
}