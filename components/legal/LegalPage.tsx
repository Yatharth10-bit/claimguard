import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { LegalDocument } from "@/lib/legalContent";

export function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <div className="min-h-screen bg-stone px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="brand-link flex items-center gap-2.5 font-extrabold text-ink">
          <span className="brand-mark grid h-8 w-8 place-items-center rounded-[10px] border border-transparent bg-ink text-[#43dfc6]"><ShieldCheck size={16} /></span>
          <span className="text-base tracking-[-.035em]">ClaimGuard</span>
        </Link>
        <article className="surface mt-8 p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">ClaimGuard policies</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-.03em]">{document.title}</h1>
          <p className="mt-2 text-sm text-muted">Last updated: {document.lastUpdated}</p>
          <p className="mt-6 text-sm leading-7 text-muted">{document.intro}</p>

          <div className="mt-8 space-y-8">
            {document.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-base font-bold tracking-[-.02em] text-ink">{section.heading}</h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-muted">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets?.length ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-muted">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          {document.contactEmail ? (
            <p className="mt-8 border-t border-black/10 pt-6 text-sm leading-7 text-muted">
              Contact: <a className="font-semibold text-ink underline-offset-2 hover:underline" href={`mailto:${document.contactEmail}`}>{document.contactEmail}</a>
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
            <Link href="/terms" className="hover:text-ink hover:underline">Terms</Link>
            <Link href="/privacy" className="hover:text-ink hover:underline">Privacy</Link>
            <Link href="/cookies" className="hover:text-ink hover:underline">Cookies</Link>
            <Link href="/disclaimer" className="hover:text-ink hover:underline">Disclaimer</Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="secondary">Back to home</Link>
            <Link href="/signup" className="primary">Create account <ArrowRight size={16} /></Link>
          </div>
        </article>
      </div>
    </div>
  );
}