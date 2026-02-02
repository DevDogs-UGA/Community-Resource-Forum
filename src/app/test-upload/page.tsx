"use client";

import { useState } from "react";
import DropImageUpload from "~/components/DropImageUpload";

export default function DraftPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 gap-6">
      <h1 className="text-2xl font-bold">Draft a Post</h1>

      <DropImageUpload
        onUploadSuccess={(url) => {
          setImageUrl(url);
          alert("Image uploaded successfully: " + url);
        }}
      />

      {imageUrl && (
        <div className="text-center">
          <p className="text-green-600 font-medium mb-2">✅ Uploaded Image</p>
          <img src={imageUrl} alt="uploaded" className="max-h-64 rounded-lg" />
        </div>
      )}
    </div>
  );
}

