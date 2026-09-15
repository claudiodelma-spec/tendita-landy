import React, { useEffect, useState } from "react";
import { storeService } from "../services/storeService";

export function TopBar() {
  const [businessName, setBusinessName] = useState("Tendita Landy");

  useEffect(() => {
    storeService
      .getBusinessInfo()
      .then((info) => info.name && setBusinessName(info.name))
      .catch(() => {});
  }, []);

  return (
    <header className="flex items-center justify-between px-5 pt-5 pb-1">
      <div className="flex items-center gap-2.5">
        <span className="h-10 w-10 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-pink-200">
          TL
        </span>
        <div>
          <p className="font-bold text-slate-900 leading-tight">{businessName}</p>
          <p className="text-[11px] text-slate-400">Escuela · Sabor · Control</p>
        </div>
      </div>
    </header>
  );
}
