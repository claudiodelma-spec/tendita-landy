import React, { useRef, useState } from "react";
import { Image as ImageIcon, Upload, X } from "lucide-react";

interface Props {
  value: string; // data URI or external URL, or "" if empty
  onChange: (value: string) => void;
  label?: string;
  maxWidth?: number; // px, default 900 — keeps the stored file small
}

/**
 * Sube fotos reales sin depender de ningún servicio externo (Drive, S3,
 * etc.): redimensiona/comprime la imagen en el propio navegador y la guarda
 * como base64 directamente en el campo imageUrl (funciona igual que una URL
 * normal en <img src>). Simple, gratis, sin configuración adicional.
 */
export function ImageUploadInput({ value, onChange, label = "Foto", maxWidth = 900 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    setError(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxWidth / img.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setLoading(false);
            setError("Tu navegador no pudo procesar esta imagen. Prueba con otra foto.");
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
          onChange(dataUrl);
          setLoading(false);
        } catch {
          setLoading(false);
          setError("No se pudo convertir esta imagen. Prueba guardándola como JPG o PNG primero.");
        }
      };
      img.onerror = () => {
        setLoading(false);
        // Cualquier formato de imagen es aceptado, pero el navegador debe
        // poder decodificarlo (JPG, PNG, GIF, WEBP, BMP sí; HEIC/HEIF de
        // iPhone y algunos RAW normalmente no, fuera de Safari).
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        const likelyHeic = ext === "heic" || ext === "heif" || file.type === "image/heic" || file.type === "image/heif";
        setError(
          likelyHeic
            ? `El formato ${ext.toUpperCase()} (típico de fotos de iPhone) no es compatible con este navegador. Cambia el ajuste de la cámara a "Más compatible" o convierte la foto a JPG antes de subirla.`
            : `No se pudo abrir este archivo como imagen (${file.type || "formato desconocido"}). Prueba con un JPG, PNG, GIF o WEBP.`
        );
      };
      img.src = String(reader.result);
    };
    reader.onerror = () => {
      setLoading(false);
      setError("No se pudo leer el archivo desde tu dispositivo. Intenta de nuevo.");
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="" className="h-28 w-28 object-cover rounded-xl border border-slate-200" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-rose-600 shadow-sm"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="w-full h-28 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-blue-300 hover:text-blue-500 disabled:opacity-60"
        >
          {loading ? (
            <span className="text-xs">Procesando…</span>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span className="text-xs">Subir foto</span>
            </>
          )}
        </button>
      )}

      {value && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
        >
          <ImageIcon className="h-3.5 w-3.5" /> Cambiar foto
        </button>
      )}
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
}
