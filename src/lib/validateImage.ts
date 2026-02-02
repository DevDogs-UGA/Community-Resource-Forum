// src/lib/validateImage.ts
export default function validateImage(file: File, maxSizeMB = 5): string | null {
  if (!file.type.startsWith("image/")) return "Only image files are allowed.";
  if (file.size > maxSizeMB * 1024 * 1024)
    return `File too large (max ${maxSizeMB}MB).`;
  return null;
}
