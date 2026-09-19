import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  Building2,
  Users2,
  Target,
  Palmtree,
  TrendingDown,
  ShoppingBag,
  Tag,
  UtensilsCrossed,
  Images,
  FileText,
  BarChart3,
  UserCog,
  Settings,
  ShieldCheck,
  Bell,
  User,
  LogOut,
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

export function AdminLayout() {
  const { user, logout, hasPermission } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-slate-800">
          <span className="h-9 w-9 rounded-full bg-orange-400 flex items-center justify-center text-slate-900 font-bold">
            TL
          </span>
          <div>
            <p className="text-white font-semibold leading-tight">Tendita Landy</p>
            <p className="text-xs text-slate-500">Escuela · Sabor · Control</p>
          </div>
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
                        `w-full flex items-center gap-3 px-5 py-2 text-sm transition-colors ${
                          isActive ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-300"
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" />
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
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Panel de Gestión</h1>
            <p className="text-xs text-slate-400">Tendita Landy</p>
          </div>
          <div className="flex items-center gap-4">
            {IS_SANDBOX && (
              <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
                🧪 SANDBOX
              </span>
            )}
            <Bell className="h-5 w-5 text-slate-400" />
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                <User className="h-4 w-4 text-slate-500" />
              </span>
              <div className="text-xs">
                <p className="font-medium text-slate-700">{user?.name ?? user?.email}</p>
                <p className="text-slate-400">{user?.roles.join(", ")}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
