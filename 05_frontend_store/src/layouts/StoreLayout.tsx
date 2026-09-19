import React from "react";
import { Outlet } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { CartBar } from "../components/CartBar";
import { IS_SANDBOX } from "../config/api";

export function StoreLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-orange-50 to-yellow-50 pb-28 max-w-md mx-auto relative">
      {IS_SANDBOX && (
        <div className="bg-amber-100 text-amber-700 text-[11px] text-center py-1 font-medium">
          🧪 MODO DEMO — ningún pedido es real
        </div>
      )}
      <TopBar />
      <div className="pb-4">
        <Outlet />
      </div>
      <CartBar />
      <BottomNav />
    </div>
  );
}
