"use client";
import { useState } from "react";
import { PiTrashBold, PiImageSquareBold } from "react-icons/pi";
import validateImage from "~/lib/validateImage";

interface ImageUploadGalleryProps {
  onImagesChange?: (urls: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

export default function ImageUploadGallery({
  onImagesChange,
  maxImages = 4,
  maxSizeMB = 10,
}: ImageUploadGalleryProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (uploadedImages.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed.`);
      return;
    }

    const validation = validateImage(file, maxSizeMB);
    if (validation) {
      setError(validation);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Get presigned URL from API
      const res = await fetch(
        `/api/upload-url?filename=${file.name}&filetype=${file.type}`
      );
      if (!res.ok) throw new Error("Failed to get upload URL.");
      const { uploadUrl, fileUrl } = await res.json();

      // Upload image to S3 or LocalStack
      const upload = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!upload.ok) throw new Error("Upload failed.");

      const newImages = [...uploadedImages, fileUrl];
      setUploadedImages(newImages);
      if (onImagesChange) onImagesChange(newImages);
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length && uploadedImages.length + i < maxImages; i++) {
      const file = files.item(i);
      if (file) handleFileSelect(file);
    }
  };

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    if (onImagesChange) onImagesChange(newImages);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <label className="mx-auto flex w-full max-w-4xl items-center gap-2 font-bold">
        <PiImageSquareBold /> Images ({uploadedImages.length}/{maxImages})
      </label>

      <div className="relative -mx-8 bg-gray-200 px-8 py-4">
        <div className="mx-auto w-full max-w-4xl space-y-4">
          {/* Upload Area */}
          {uploadedImages.length < maxImages && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
            >
              <p className="text-gray-600 text-center mb-2">
                Drag & drop images or click below to select
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploading}
                className="mt-2"
                onChange={(e) => {
                  const files = e.currentTarget.files;
                  if (files) {
                    for (
                      let i = 0;
                      i < files.length && uploadedImages.length + i < maxImages;
                      i++
                    ) {
                      const file = files.item(i);
                      if (file) handleFileSelect(file);
                    }
                  }
                }}
              />
              <button
                type="button"
                disabled={uploading}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {uploading ? "Uploading..." : "Select Images"}
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Image Gallery */}
          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {uploadedImages.map((url, index) => (
                <div
                  key={index}
                  className="relative group rounded-lg overflow-hidden bg-gray-300"
                >
                  <img
                    src={url}
                    alt={`uploaded-${index}`}
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                  >
                    <PiTrashBold className="text-white text-2xl" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Hidden input to store image URLs for form submission */}
          <input
            type="hidden"
            name="imageUrls"
            value={JSON.stringify(uploadedImages)}
            readOnly
          />
        </div>
      </div>
    </div>
  );
}
