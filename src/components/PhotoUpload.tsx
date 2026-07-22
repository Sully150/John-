import { useState, useCallback, useRef, type DragEvent } from "react";
import type { VehicleDetails, UploadedPhoto } from "../services/types";

interface Props {
  vehicle: VehicleDetails;
  onSubmit: (photos: UploadedPhoto[]) => void;
  onBack: () => void;
  loading: boolean;
}

const MAX_PHOTOS = 10;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export function PhotoUpload({ vehicle, onSubmit, onBack, loading }: Props) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArr = Array.from(files);
      const validFiles = fileArr.filter((f) =>
        ACCEPTED_TYPES.includes(f.type),
      );

      if (validFiles.length === 0) {
        alert("Please upload JPG, PNG, WebP, or HEIC images.");
        return;
      }

      const remaining = MAX_PHOTOS - photos.length;
      const toAdd = validFiles.slice(0, remaining);

      if (toAdd.length < validFiles.length) {
        alert(`Maximum ${MAX_PHOTOS} photos. Adding first ${toAdd.length}.`);
      }

      const newPhotos: UploadedPhoto[] = toAdd.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      setPhotos((prev) => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
    },
    [photos.length],
  );

  const removePhoto = useCallback(
    (id: string) => {
      setPhotos((prev) => {
        const photo = prev.find((p) => p.id === id);
        if (photo) URL.revokeObjectURL(photo.previewUrl);
        return prev.filter((p) => p.id !== id);
      });
    },
    [],
  );

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = () => {
    if (photos.length === 0) {
      alert("Please upload at least one photo.");
      return;
    }
    onSubmit(photos);
  };

  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Vehicle Condition Photos
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload photos of{" "}
          <span className="font-medium text-gray-700">
            {vehicle.make} {vehicle.model} ({vehicle.registration})
          </span>{" "}
          for AI condition assessment
        </p>
      </div>

      {/* Upload area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleFileSelect}
        className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-3 text-sm font-medium text-gray-700">
          {dragActive
            ? "Drop photos here"
            : "Drag and drop photos, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          JPG, PNG, WebP, or HEIC — up to {MAX_PHOTOS} photos
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Tip: Include front, rear, both sides, and any damaged panels
        </p>
      </div>

      {/* Photo thumbnails */}
      {photos.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">
              {photos.length} / {MAX_PHOTOS} photos uploaded
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative">
                <img
                  src={photo.previewUrl}
                  alt="Vehicle"
                  className="aspect-square w-full rounded-lg border border-gray-200 object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(photo.id);
                  }}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1">
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || photos.length === 0}
          className="btn-primary flex-1"
        >
          {loading ? (
            <>
              <svg
                className="mr-2 h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Analysing...
            </>
          ) : (
            <>
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Assess Condition
            </>
          )}
        </button>
      </div>
    </div>
  );
}
