"use client";
import { useState } from "react";
import validateImage from "src/lib/validateImage";

interface DropImageUploadProps {
  onUploadSuccess: (url: string) => void;
  maxSizeMB?: number;
}

export default function DropImageUpload({
  onUploadSuccess,
  maxSizeMB = 10,
}: DropImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (f: File) => {
    const validation = validateImage(f, maxSizeMB);
    if (validation) {
      setError(validation);
      setFile(null);
      setPreview(null);
      return;
    }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
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

      onUploadSuccess(fileUrl);
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 p-6 rounded-xl w-full max-w-xl mx-auto bg-gray-50 hover:bg-gray-100 transition"
    >
      {preview ? (
        <img src={preview} alt="preview" className="max-h-64 rounded-lg mb-4" />
      ) : (
        <p className="text-gray-600 text-center">
          Drag & drop an image or click below to select
        </p>
      )}
      <input
        type="file"
        accept="image/*"
        className="mt-2"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileSelect(f);
        }}
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
