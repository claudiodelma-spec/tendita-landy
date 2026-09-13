import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { AdminLayout } from "./layouts/AdminLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { RentaPage } from "./pages/RentaPage";
import { NominaPage } from "./pages/NominaPage";
import { GastosPage } from "./pages/GastosPage";
import { MetasAhorroPage } from "./pages/MetasAhorroPage";
import { VacacionesPage } from "./pages/VacacionesPage";
import { ProductosPage } from "./pages/ProductosPage";
import { CategoriasPage } from "./pages/CategoriasPage";
import { MenuPage } from "./pages/MenuPage";
import { CarruselPage } from "./pages/CarruselPage";
import { PedidosPage } from "./pages/PedidosPage";
import { ConfiguracionPage } from "./pages/ConfiguracionPage";
import { ReportesPage } from "./pages/ReportesPage";
import { UsuariosPage } from "./pages/UsuariosPage";
import { AuditoriaPage } from "./pages/AuditoriaPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-sm text-slate-400">Cargando…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/rentas" element={<RentaPage />} />
        <Route path="/nomina" element={<NominaPage />} />
        <Route path="/gastos" element={<GastosPage />} />
        <Route path="/metas-ahorro" element={<MetasAhorroPage />} />
        <Route path="/vacaciones" element={<VacacionesPage />} />
        <Route path="/productos" element={<ProductosPage />} />
        <Route path="/categorias" element={<CategoriasPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/carrusel" element={<CarruselPage />} />
        <Route path="/pedidos" element={<PedidosPage />} />
        <Route path="/configuracion" element={<ConfiguracionPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/usuarios" element={<UsuariosPage />} />
        <Route path="/auditoria" element={<AuditoriaPage />} />
        {/* Todas las secciones del spec ya tienen pantalla — quedan las
            Fases 11–12: pruebas integrales y preparación para producción. */}
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
