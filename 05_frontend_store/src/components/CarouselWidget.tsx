import React, { useEffect, useState } from "react";
import type { CarouselImage } from "../types/store";

export function CarouselWidget({ images }: { images: CarouselImage[] }) {
  const active = [...images].sort((a, b) => a.order - b.order);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (active.length <= 1) return;
    const seconds = active[index]?.displaySeconds ?? 5;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % active.length), seconds * 1000);
    return () => clearTimeout(timer);
  }, [index, active]);

  if (active.length === 0) {
    return (
      <div className="mx-5 rounded-3xl bg-gradient-to-br from-pink-400 via-rose-400 to-orange-300 h-36 flex items-center justify-center text-center px-6 shadow-lg shadow-pink-100">
        <p className="text-white font-bold text-lg">¡Bienvenidos a Tendita Landy! 🎉</p>
      </div>
    );
  }

  const current = active[index];
  return (
    <div className="mx-5 rounded-3xl h-36 relative overflow-hidden shadow-lg shadow-pink-100">
      {current.imageUrl ? (
        <img src={current.imageUrl} alt={current.title ?? ""} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-rose-400 to-orange-300" />
      )}
      {(current.title || current.description) && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex flex-col justify-end p-4">
          {current.title && <p className="text-white font-bold">{current.title}</p>}
          {current.description && <p className="text-white/90 text-xs">{current.description}</p>}
        </div>
      )}
      {active.length > 1 && (
        <div className="absolute bottom-2 right-3 flex gap-1">
          {active.map((_, i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
