"use client";

import { Check } from "lucide-react";
import type { OnboardingDraft, OnboardingStep } from "@/components/onboarding/onboarding-config";
import { getProductSuggestions } from "@/components/onboarding/onboarding-config";

type OnboardingFlashcardProps = {
  step: OnboardingStep;
  draft: OnboardingDraft;
  direction: "forward" | "back";
  onChange: (field: OnboardingStep["id"], value: string | string[]) => void;
};

export function OnboardingFlashcard({ step, draft, direction, onChange }: OnboardingFlashcardProps) {
  const value = draft[step.id];
  const suggestions = step.id === "productType" ? getProductSuggestions(draft.sector) : step.suggestions;

  return (
    <div
      key={`${step.id}-${direction}`}
      className={`onboarding-card surface mx-auto w-full max-w-xl p-6 sm:p-8 ${direction === "forward" ? "onboarding-enter-forward" : "onboarding-enter-back"}`}
    >
      <h2 className="text-xl font-extrabold tracking-[-.03em] text-ink sm:text-2xl">{step.question}</h2>
      {step.helperText && <p className="mt-3 text-sm leading-6 text-muted">{step.helperText}</p>}

      <div className="mt-6">
        {step.inputType === "text" && (
          <>
            <input
              className="input"
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(step.id, e.target.value)}
              placeholder={step.placeholder}
              autoFocus
            />
            {suggestions && suggestions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onChange(step.id, item)}
                    className="rounded-full border border-black/[.08] bg-stone px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-[#14b8a6]/40 hover:bg-mint"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {step.inputType === "textarea" && (
          <textarea
            className="input min-h-[120px] resize-y"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(step.id, e.target.value)}
            placeholder={step.placeholder}
            autoFocus
          />
        )}

        {(step.inputType === "select-cards" || step.inputType === "single-select") && step.options && (
          <div className={`grid gap-2 ${step.inputType === "select-cards" ? "sm:grid-cols-2" : ""}`}>
            {step.options.map((option) => {
              const selected = value === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChange(step.id, option)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                    selected
                      ? "border-[#14b8a6] bg-mint text-safe shadow-sm"
                      : "border-black/[.08] bg-white text-ink hover:border-black/[.16] hover:bg-stone"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    {option}
                    {selected && <Check size={16} className="shrink-0 text-safe" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {step.inputType === "multi-select" && step.options && (
          <div className="flex flex-wrap gap-2">
            {step.options.map((option) => {
              const selected = Array.isArray(value) && value.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    const current = Array.isArray(value) ? value : [];
                    onChange(
                      step.id,
                      selected ? current.filter((item) => item !== option) : [...current, option],
                    );
                  }}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    selected
                      ? "border-[#14b8a6] bg-mint text-safe"
                      : "border-black/[.08] bg-white text-ink hover:border-black/[.16]"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}