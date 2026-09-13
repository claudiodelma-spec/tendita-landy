import React from "react";

export function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${clamped}%` }} />
    </div>
  );
}
