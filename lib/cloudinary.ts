"use client";

export async function uploadImageToCloudinary(file: File) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset)
    throw new Error("Cloudinary chưa được cấu hình trong .env");

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body,
    },
  );
  const data = (await response.json()) as {
    secure_url?: string;
    error?: { message?: string };
  };
  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message ?? "Tải ảnh lên Cloudinary thất bại.");
  }
  return data.secure_url;
}
