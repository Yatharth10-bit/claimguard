"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Gauge } from "lucide-react";

type ScoreData = {
  score: number;
  grade: string;
  summary: string;
  checklist: { id: string; label: string; done: boolean }[];
};

const gradeColors: Record<string, string> = {
  A: "text-emerald-600",
  B: "text-blue-600",
  C: "text-amber-600",
  D: "text-orange-600",
  F: "text-red-600",
};

export function ComplianceScoreCard() {
  const [data, setData] = useState<ScoreData | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/compliance-score")
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((body) => {
        if (active && body) setData(body);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!data) {
    return (
      <div className="surface p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Compliance score</p>
        <p className="mt-3 text-sm text-muted">Loading score...</p>
      </div>
    );
  }

  const doneCount = data.checklist.filter((c) => c.done).length;

  return (
    <div className="surface p-5">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
          <Gauge size={22} />
        </span>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Compliance score</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold">{data.score}</span>
            <span className={`text-xl font-bold ${gradeColors[data.grade] || ""}`}>Grade {data.grade}</span>
          </div>
          <p className="mt-2 text-sm text-muted">{data.summary}</p>
        </div>
      </div>
      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          Onboarding checklist · {doneCount}/{data.checklist.length}
        </p>
        <ul className="mt-3 space-y-2">
          {data.checklist.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-sm">
              <CheckCircle2 size={16} className={item.done ? "text-emerald-500" : "text-slate-300"} />
              <span className={item.done ? "text-muted line-through" : ""}>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <Link href="/products" className="secondary mt-4 inline-flex text-sm">Improve score</Link>
    </div>
  );
}