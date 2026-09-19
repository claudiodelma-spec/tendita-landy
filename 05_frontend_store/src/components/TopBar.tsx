import React, { useEffect, useState } from "react";
import { storeService } from "../services/storeService";

export function TopBar() {
  const [businessName, setBusinessName] = useState("Tendita Landy");
  const [logo, setLogo] = useState("");

  useEffect(() => {
    storeService
      .getBusinessInfo()
      .then((info) => {
        if (info.name) setBusinessName(info.name);
        if (info.logo) setLogo(info.logo);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="flex items-center justify-between px-5 pt-5 pb-1">
      <div className="flex items-center gap-3">
        {logo ? (
          <img src={logo} alt={businessName} className="h-11 w-11 rounded-2xl object-cover shadow-md shadow-pink-200" />
        ) : (
          <span className="h-11 w-11 rounded-2xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-orange-400 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-pink-200">
            TL
          </span>
        )}
        <div>
          <p className="font-extrabold text-slate-900 leading-tight">{businessName}</p>
          <p className="text-[11px] text-fuchsia-400 font-medium">Escuela · Sabor · Control</p>
        </div>
      </div>
    </header>
  );
}
