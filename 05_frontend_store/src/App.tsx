import React from "react";
import { Route, Routes } from "react-router-dom";
import { CartProvider } from "./hooks/useCart";
import { StoreLayout } from "./layouts/StoreLayout";
import { HomePage } from "./pages/HomePage";
import { ProductsPage } from "./pages/ProductsPage";
import { CheckoutPage } from "./pages/CheckoutPage";

// Tienda pública — sin cuentas, sin login. Cualquier visitante puede
// navegar, armar su carrito y pedir por WhatsApp directamente.
export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route element={<StoreLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/productos" element={<ProductsPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Route>
      </Routes>
    </CartProvider>
  );
}
