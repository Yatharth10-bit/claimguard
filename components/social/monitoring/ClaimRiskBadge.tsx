const styles: Record<string, string> = {
  "High Risk": "bg-rose text-high",
  "Medium Risk": "bg-apricot text-medium",
  "Medium-High Risk": "bg-apricot text-medium",
  "Low Risk": "bg-mint text-safe",
  "Needs Review": "bg-amber-100 text-amber-800",
  Safe: "bg-emerald-50 text-safe",
};

export function ClaimRiskBadge({ level }: { level: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${styles[level] || "bg-stone text-muted"}`}>
      {level}
    </span>
  );
}