import React, { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  ShoppingBag,
  Tag,
  UtensilsCrossed,
  Images,
  BarChart3,
  UserCog,
  Settings,
  ShieldCheck,
  Bell,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { IS_SANDBOX } from "../config/api";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}
interface NavSection {
  title?: string;
  items: NavItem[];
}

// Section 7 — same sidebar structure/order as the spec's Panel Administrativo.
const NAV_SECTIONS: NavSection[] = [
  { items: [{ to: "/", label: "Inicio", icon: LayoutDashboard, permission: "dashboard.view" }] },
  {
    title: "Gestión Financiera",
    items: [
      { to: "/gestion-operativa", label: "Renta, Nómina y Gastos", icon: Building2, permission: "finance.view" },
    ],
  },
  {
    title: "Tienda",
    items: [
      { to: "/productos", label: "Productos", icon: ShoppingBag, permission: "store.view" },
      { to: "/categorias", label: "Categorías", icon: Tag, permission: "store.view" },
      { to: "/menu", label: "Menú Diario", icon: UtensilsCrossed, permission: "store.view" },
      { to: "/carrusel", label: "Carrusel", icon: Images, permission: "store.view" },
    ],
  },
  {
    title: "Reportes",
    items: [{ to: "/reportes", label: "Reportes financieros", icon: BarChart3, permission: "reports.view" }],
  },
  {
    title: "Administración",
    items: [
      { to: "/usuarios", label: "Usuarios", icon: UserCog, permission: "users.manage" },
      { to: "/configuracion", label: "Configuración", icon: Settings, permission: "settings.manage" },
      { to: "/auditoria", label: "Auditoría", icon: ShieldCheck, permission: "audit.view" },
    ],
  },
];

// Ajuste posterior: panel usable tanto en web como en celular. El sidebar
// fijo de 256px rompía la vista en móvil (todo se veía "gigante" y no se
// podía navegar) — ahora es un cajón (drawer) que se abre con el botón ☰ en
// pantallas chicas, y queda fijo/visible como antes en pantallas medianas o
// más grandes (md:).
export function AdminLayout() {
  const { user, logout, hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 transform transition-transform duration-200 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-5 flex items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-full bg-orange-400 flex items-center justify-center text-slate-900 font-bold">
              TL
            </span>
            <div>
              <p className="text-white font-semibold leading-tight">Tendita Landy</p>
              <p className="text-xs text-slate-500">Escuela · Sabor · Control</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_SECTIONS.map((section, i) => {
            const visibleItems = section.items.filter((it) => !it.permission || hasPermission(it.permission));
            if (visibleItems.length === 0) return null;
            return (
              <div key={i} className="mb-4">
                {section.title && (
                  <p className="px-5 text-[11px] uppercase tracking-wide text-slate-500 mb-1 mt-2">
                    {section.title}
                  </p>
                )}
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      className={({ isActive }) =>
                        `w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                          isActive ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-300"
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 px-5 py-4">
          <button onClick={logout} className="w-full flex items-center gap-3 text-sm text-slate-300 hover:text-white">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500 shrink-0">
              <Menu className="h-6 w-6" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">Panel de Gestión</h1>
              <p className="text-xs text-slate-400 hidden sm:block">Tendita Landy</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {IS_SANDBOX && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                🧪 SANDBOX
              </span>
            )}
            <Bell className="h-5 w-5 text-slate-400 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-slate-500" />
              </span>
              <div className="text-xs hidden sm:block">
                <p className="font-medium text-slate-700">{user?.name ?? user?.email}</p>
                <p className="text-slate-400">{user?.roles.join(", ")}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
