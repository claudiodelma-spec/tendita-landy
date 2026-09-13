import React, { useEffect, useState } from "react";
import { Plus, Trash2, Cloud } from "lucide-react";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { storeService } from "../services/storeService";
import { driveService } from "../services/driveService";
import type { Carousel } from "../types/store";

// Section 23 — Carrusel: máximo 5 imágenes activas, reordenar, activar/desactivar,
// tiempo de exposición. El límite de 5 lo aplica el backend (POST /carousel/images).
export function CarruselPage() {
  const [carousel, setCarousel] = useState<Carousel | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ imageUrl: "", title: "", displaySeconds: "5" });
  const [mockUploading, setMockUploading] = useState(false);

  function load() {
    storeService.getCarousel().then(setCarousel);
  }
  useEffect(load, []);

  // Section 35 — Google Drive en modo MOCK: simula la subida y devuelve una
  // URL falsa, para poder construir/probar el flujo antes de conectar Drive real.
  async function simulateDriveUpload() {
    if (!form.title.trim()) {
      setError("Escribe un título/nombre de archivo antes de simular la subida.");
      return;
    }
    setMockUploading(true);
    setError(null);
    try {
      const result = await driveService.mockUpload(`${form.title.trim()}.jpg`);
      setForm((f) => ({ ...f, imageUrl: result.driveUrl }));
    } catch (err: any) {
      setError(err.message ?? "No se pudo simular la subida a Drive");
    } finally {
      setMockUploading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await storeService.addCarouselImage({
        imageUrl: form.imageUrl,
        title: form.title || undefined,
        displaySeconds: Number(form.displaySeconds),
        active: true,
      });
      setModalOpen(false);
      setForm({ imageUrl: "", title: "", displaySeconds: "5" });
      load();
    } catch (err: any) {
      setError(err.message ?? "No se pudo agregar la imagen");
    }
  }

  async function toggleActive(imageId: string, active: boolean) {
    await storeService.updateCarouselImage(imageId, { active: !active });
    load();
  }

  async function remove(imageId: string) {
    await storeService.deleteCarouselImage(imageId);
    load();
  }

  const images = carousel?.images ?? [];
  const activeCount = images.filter((i) => i.active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Carrusel</h2>
          <p className="text-xs text-slate-400">
            {activeCount} / {carousel?.maxSlots ?? 5} imágenes activas
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Agregar imagen
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((img) => (
          <Card key={img.id}>
            <div className="h-28 rounded-lg bg-gradient-to-br from-pink-200 to-orange-200 flex items-center justify-center text-4xl mb-3">
              🖼️
            </div>
            <p className="font-medium text-slate-800 text-sm truncate">{img.title ?? "Sin título"}</p>
            <p className="text-xs text-slate-400 mb-2 truncate">{img.imageUrl}</p>
            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleActive(img.id, img.active)}
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  img.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {img.active ? "Activa" : "Inactiva"}
              </button>
              <button onClick={() => remove(img.id)} className="text-slate-400 hover:text-rose-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
        {images.length === 0 && <p className="text-sm text-slate-400 col-span-full">Aún no hay imágenes en el carrusel.</p>}
      </div>

      <Modal open={modalOpen} title="Agregar imagen al carrusel" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-3">
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <input
            placeholder="Título (usado también como nombre de archivo simulado)"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <button
            type="button"
            onClick={simulateDriveUpload}
            disabled={mockUploading}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 text-slate-500 rounded-lg py-2 text-xs hover:bg-slate-50 disabled:opacity-60"
          >
            <Cloud className="h-3.5 w-3.5" />
            {mockUploading ? "Simulando subida a Drive…" : "Simular subida a Google Drive (mock)"}
          </button>
          <input
            required
            placeholder="URL de la imagen (o usa el botón de arriba)"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />
          <input
            type="number"
            placeholder="Segundos de exposición"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={form.displaySeconds}
            onChange={(e) => setForm({ ...form, displaySeconds: e.target.value })}
          />
          <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">
            Guardar
          </button>
        </form>
      </Modal>
    </div>
  );
}
