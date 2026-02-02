"use client";
import { useState } from "react";

export default function ImageUpload({ onImageUpload }: { onImageUpload: (url: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith("image/")) {
      setFile(dropped);
      setPreview(URL.createObjectURL(dropped));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      // 1️⃣ get presigned URL from backend
      const res = await fetch(`/api/upload-url?filename=${file.name}&filetype=${file.type}`);
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, fileUrl } = await res.json();

      // 2️⃣ upload file directly to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");

      // 3️⃣ send URL back to parent component
      onImageUpload(fileUrl);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed, please try again");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 p-6 rounded-xl w-full max-w-xl mx-auto bg-gray-50 hover:bg-gray-100 transition"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {preview ? (
        <img src={preview} alt="preview" className="max-h-64 rounded-lg mb-4" />
      ) : (
        <p className="text-gray-600">Drag & drop an image or click below</p>
      )}

      <input
        type="file"
        accept="image/*"
        className="mt-2"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setFile(f);
            setPreview(URL.createObjectURL(f));
          }
        }}
      />

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {uploading ? "Uploading..." : "Upload Image"}
      </button>
    </div>
  );
}
