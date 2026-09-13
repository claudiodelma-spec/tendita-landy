import React, { useEffect, useState } from "react";
import type { CarouselImage } from "../types/store";

export function CarouselWidget({ images }: { images: CarouselImage[] }) {
  const active = images.filter((i) => i.active).sort((a, b) => a.order - b.order);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (active.length === 0) return;
    const seconds = active[index]?.displaySeconds ?? 5;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % active.length), seconds * 1000);
    return () => clearTimeout(timer);
  }, [index, active]);

  if (active.length === 0) {
    return (
      <div className="mx-4 rounded-2xl bg-gradient-to-br from-pink-300 via-orange-200 to-yellow-200 h-32 flex items-center justify-center text-white font-semibold">
        ¡Bienvenidos a Tendita Landy! 🎉
      </div>
    );
  }

  const current = active[index];
  return (
    <div className="mx-4 rounded-2xl bg-gradient-to-br from-pink-300 via-orange-200 to-yellow-200 h-32 flex flex-col items-center justify-center text-center px-4">
      <p className="text-white font-semibold">{current.title ?? "Promoción"}</p>
      {current.description && <p className="text-white/90 text-xs mt-1">{current.description}</p>}
      <div className="flex gap-1 mt-2">
        {active.map((_, i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`} />
        ))}
      </div>
    </div>
  );
}
