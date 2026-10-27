import { useRef, useState } from "react";
import type { TripImage } from "../../types/trip";
import "./AdminImageUpload.css";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — atitinka BE middleware/upload.ts ribą

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/admin/media/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? "Nepavyko įkelti nuotraukos");
  }

  const { url } = await res.json();
  return url;
}

interface AdminImageUploadProps {
  images: TripImage[];
  onChange: (images: TripImage[]) => void;
  // false (default) = one banner slot; true = a gallery any number of
  // photos can be added to.
  multiple?: boolean;
}

// Reads files straight from the admin's computer (no URL field) and stores
// them as data: URLs — works today with zero backend, same "swap later"
// pattern as the rest of this app: once a real upload endpoint exists, only
// the inside of handleFiles needs to change (POST the file, use the
// returned hosted URL instead of the data: URL), this component's own
// images/onChange contract stays the same.
export default function AdminImageUpload({
  images,
  onChange,
  multiple = false,
}: AdminImageUploadProps) {
  const [error, setError] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError("");

    const accepted: TripImage[] = [];
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} nėra paveikslėlio failas.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} per didelis (maks. 5MB).`);
        continue;
      }
      try {
        const url = await uploadFile(file);
        accepted.push({ url, alt: "", sortOrder: 0 });
      } catch (err) {
        setError(err instanceof Error ? err.message : `Nepavyko įkelti ${file.name}.`);
      }
    }
    if (accepted.length === 0) return;

    const next = multiple ? [...images, ...accepted] : accepted.slice(0, 1);
    onChange(next.map((img, i) => ({ ...img, sortOrder: i })));
  };

  const updateAlt = (index: number, alt: string) => {
    onChange(images.map((img, i) => (i === index ? { ...img, alt } : img)));
  };

  const removeImage = (index: number) => {
    onChange(
      images.filter((_, i) => i !== index).map((img, i) => ({ ...img, sortOrder: i }))
    );
  };

  const moveImage = (from: number, to: number) => {
    if (from === to) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next.map((img, i) => ({ ...img, sortOrder: i })));
  };

  // Single mode shows exactly one button either way — "add" when empty,
  // "replace" once a photo is set. Gallery mode always offers "add more".
  const addButtonLabel = multiple
    ? images.length > 0
      ? "+ Pridėti nuotraukų"
      : "+ Įkelti nuotrauką"
    : images.length > 0
      ? "Pakeisti nuotrauką"
      : "+ Įkelti nuotrauką";

  return (
    <div className="admin-image-upload">
      {images.length > 0 && (
        <div className="admin-image-upload-grid">
          {images.map((img, i) => (
            <div
              key={i}
              className={`admin-image-upload-item${draggedIndex === i ? " is-dragging" : ""}${dragOverIndex === i && draggedIndex !== i ? " is-drag-over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedIndex !== null && draggedIndex !== i) setDragOverIndex(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedIndex !== null) moveImage(draggedIndex, i);
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
            >
              <div
                className="admin-image-upload-drag-handle"
                title="Tempti ir perrikiuoti"
                draggable
                onDragStart={() => setDraggedIndex(i)}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
              >
                ⠿
              </div>
              <img src={img.url} alt={img.alt || ""} />
              <input
                placeholder="Aprašymas (alt)"
                value={img.alt}
                onChange={(e) => updateAlt(i, e.target.value)}
              />
              <button
                type="button"
                className="admin-link is-danger"
                onClick={() => removeImage(i)}
              >
                Pašalinti
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="admin-add" onClick={() => inputRef.current?.click()}>
        {addButtonLabel}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error && <p className="admin-image-upload-error">{error}</p>}
    </div>
  );
}
