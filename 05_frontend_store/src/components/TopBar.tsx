import React from "react";
import { Bell } from "lucide-react";

export function TopBar() {
  return (
    <header className="flex items-center justify-between px-4 pt-4 pb-2">
      <div className="flex items-center gap-2">
        <span className="h-9 w-9 rounded-full bg-gradient-to-br from-pink-400 to-orange-300 flex items-center justify-center text-white font-bold text-sm">
          TL
        </span>
        <div>
          <p className="font-semibold text-slate-800 leading-tight text-sm">Tendita Landy</p>
          <p className="text-[10px] text-slate-400">Escuela · Sabor · Control</p>
        </div>
      </div>
      <Bell className="h-5 w-5 text-slate-400" />
    </header>
  );
}
