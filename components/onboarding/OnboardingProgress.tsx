type OnboardingProgressProps = {
  current: number;
  total: number;
};

export function OnboardingProgress({ current, total }: OnboardingProgressProps) {
  const percent = Math.round(((current + 1) / total) * 100);

  return (
    <div className="onboarding-progress mx-auto w-full max-w-md">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted">
        <span>Step {current + 1} of {total}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-black/[.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-lavender to-[#14b8a6] transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}