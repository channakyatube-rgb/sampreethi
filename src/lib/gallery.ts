import { createClient } from "@supabase/supabase-js";
import type { StorageProvider } from "./catalogues";

export type { StorageProvider } from "./catalogues";

export type GalleryCategory = string;

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  category: string;
  fileName: string;
  imageUrl: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  imagePath?: string;
  storageProvider: StorageProvider;
}

export interface GalleryUploadPayload {
  title: string;
  description: string;
  category: string;
  files: File[];
  storageProvider: StorageProvider;
}

interface SupabaseGalleryRow {
  id: string;
  title: string;
  category: string;
  description: string | null;
  image_url: string;
  image_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  storage_provider?: string | null;
}

interface SupabaseCategoryRow {
  name: string;
}

const resolveEnvValue = (value: string | undefined, fallback: string) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
const GALLERY_BUCKET = resolveEnvValue(import.meta.env.VITE_SUPABASE_GALLERY_BUCKET, "gallery");
const GALLERY_TABLE = resolveEnvValue(import.meta.env.VITE_SUPABASE_GALLERY_TABLE, "gallery_images");
const GALLERY_CATEGORIES_TABLE = resolveEnvValue(import.meta.env.VITE_SUPABASE_GALLERY_CATEGORIES_TABLE, "gallery_categories");

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

export const isGallerySupabaseConfigured = Boolean(supabase);

export const GALLERY_CATEGORIES: GalleryCategory[] = [
  "Showroom",
  "Plywood",
  "Veneers",
  "Laminates",
  "Doors",
  "Interiors",
  "Other",
];

const getSupabase = () => {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment (.env.local for local, Netlify Environment Variables for production).",
    );
  }
  return supabase;
};

const normalizeCategory = (category: string) => category.trim() || "Other";

const mergeCategories = (...groups: string[][]) => {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const group of groups) {
    for (const rawCategory of group) {
      const normalized = normalizeCategory(rawCategory);
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      ordered.push(normalized);
    }
  }

  return ordered;
};

const sanitizeFileName = (name: string) => name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-");

const sanitizeCategoryFolder = (category: string) =>
  category
    .toLowerCase()
    .replace(/[^a-z0-9\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "other";

const isMissingStorageProviderColumnError = (message: string, code?: string | null) =>
  code === "42703" || message.toLowerCase().includes("storage_provider");

const mapSupabaseRow = (row: SupabaseGalleryRow): GalleryItem => ({
  id: row.id,
  title: row.title,
  category: normalizeCategory(row.category),
  description: row.description ?? "",
  imageUrl: row.image_url,
  imagePath: row.image_path ?? undefined,
  fileName: row.file_name ?? "gallery-image",
  mimeType: row.mime_type ?? "",
  sizeBytes: row.size_bytes ?? 0,
  createdAt: row.created_at,
  storageProvider: (row.storage_provider as StorageProvider) ?? "supabase",
});

const insertGalleryRow = async (
  client: ReturnType<typeof getSupabase>,
  payload: Record<string, unknown>,
  storageProvider: StorageProvider,
) => {
  const withProvider = {
    ...payload,
    storage_provider: storageProvider,
  };

  let { error } = await client.from(GALLERY_TABLE).insert(withProvider);
  if (error && isMissingStorageProviderColumnError(error.message, error.code)) {
    ({ error } = await client.from(GALLERY_TABLE).insert(payload));
  }

  if (error) throw new Error(error.message);
};

const uploadToSupabase = async (client: ReturnType<typeof getSupabase>, file: File, category: string) => {
  const categoryFolder = sanitizeCategoryFolder(category);
  const filePath = `${categoryFolder}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const { error } = await client.storage.from(GALLERY_BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = client.storage.from(GALLERY_BUCKET).getPublicUrl(filePath);
  return {
    imageUrl: data.publicUrl,
    imagePath: filePath,
  };
};

const uploadToR2 = async (file: File, category: string): Promise<string> => {
  const res = await fetch("/.netlify/functions/get-r2-upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "image/jpeg",
      category: `gallery-${category}`,
    }),
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Netlify function get-r2-upload-url was not found. Run the app with `netlify dev` so /.netlify/functions routes are available.");
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to get R2 upload URL");
  }

  const { uploadUrl, publicUrl } = await res.json();

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "image/jpeg" },
    body: file,
  });

  if (!uploadRes.ok) throw new Error("R2 upload failed");
  return publicUrl;
};

const uploadToDrive = async (file: File, category: string): Promise<string> => {
  const readErrorMessage = async (response: Response) => {
    const text = await response.text();
    if (!text) return response.statusText || "Unknown Google Drive error";
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string } };
      return parsed.error?.message || text;
    } catch {
      return text;
    }
  };

  const tokenRes = await fetch("/.netlify/functions/get-drive-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category: `gallery-${category}` }),
  });

  if (!tokenRes.ok) {
    if (tokenRes.status === 404) {
      throw new Error("Netlify function get-drive-token was not found. Run the app with `netlify dev` so /.netlify/functions routes are available.");
    }
    const err = await tokenRes.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to get Drive token");
  }

  const { token, folderId } = await tokenRes.json();

  const initRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Upload-Content-Type": file.type || "image/jpeg",
      "X-Upload-Content-Length": String(file.size),
    },
    body: JSON.stringify({
      name: file.name,
      parents: [folderId],
    }),
  });

  if (!initRes.ok) {
    const detail = await readErrorMessage(initRes);
    throw new Error(`Drive session init failed (${initRes.status}): ${detail}`);
  }
  const resumableUrl = initRes.headers.get("Location");
  if (!resumableUrl) throw new Error("No resumable URL from Drive");

  const uploadRes = await fetch(resumableUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "image/jpeg" },
    body: file,
  });

  if (!uploadRes.ok) {
    const detail = await readErrorMessage(uploadRes);
    throw new Error(`Drive upload failed (${uploadRes.status}): ${detail}`);
  }
  const driveFile = await uploadRes.json();

  const pubRes = await fetch("/.netlify/functions/make-drive-file-public", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileId: driveFile.id, token }),
  });

  if (!pubRes.ok) {
    if (pubRes.status === 404) {
      throw new Error("Netlify function make-drive-file-public was not found. Run the app with `netlify dev` so /.netlify/functions routes are available.");
    }
    const err = await pubRes.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to make Drive file public");
  }

  const { publicUrl } = await pubRes.json();
  return publicUrl;
};

export const listGalleryItems = async (): Promise<GalleryItem[]> => {
  const client = getSupabase();
  const { data, error } = await client.from(GALLERY_TABLE).select("*").order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data as SupabaseGalleryRow[]) ?? []).map(mapSupabaseRow);
};

export const listGalleryCategories = async (): Promise<string[]> => {
  const client = getSupabase();

  const { data: categoryRows, error: categoryError } = await client
    .from(GALLERY_CATEGORIES_TABLE)
    .select("name")
    .order("name", { ascending: true });

  if (!categoryError) {
    const savedCategories = ((categoryRows as SupabaseCategoryRow[]) ?? []).map((row) => normalizeCategory(row.name));
    return mergeCategories(GALLERY_CATEGORIES, savedCategories);
  }

  const { data: tableRows, error: tableError } = await client.from(GALLERY_TABLE).select("category");
  if (tableError) return [...GALLERY_CATEGORIES];

  const tableCategories = ((tableRows as { category: string }[]) ?? []).map((row) => normalizeCategory(row.category));
  return mergeCategories(GALLERY_CATEGORIES, tableCategories);
};

export const uploadGalleryImages = async (payload: GalleryUploadPayload) => {
  if (payload.files.length === 0) throw new Error("No files selected.");

  const client = getSupabase();
  const normalizedCategory = normalizeCategory(payload.category);

  for (const file of payload.files) {
    if (!file.type.startsWith("image/")) {
      throw new Error(`\"${file.name}\" is not an image file.`);
    }

    let imageUrl = "";
    let imagePath = "";

    if (payload.storageProvider === "r2") {
      imageUrl = await uploadToR2(file, normalizedCategory);
      imagePath = `r2:${file.name}`;
    } else if (payload.storageProvider === "drive") {
      imageUrl = await uploadToDrive(file, normalizedCategory);
      imagePath = `drive:${file.name}`;
    } else {
      const uploadData = await uploadToSupabase(client, file, normalizedCategory);
      imageUrl = uploadData.imageUrl;
      imagePath = uploadData.imagePath;
    }

    const rowPayload = {
      title: payload.title || file.name.replace(/\.[^/.]+$/, ""),
      category: normalizedCategory,
      description: payload.description,
      file_name: file.name,
      image_url: imageUrl,
      image_path: imagePath,
      mime_type: file.type,
      size_bytes: file.size,
    };

    await insertGalleryRow(client, rowPayload, payload.storageProvider);
  }
};

export const deleteGalleryItem = async (item: GalleryItem) => {
  const client = getSupabase();

  if (item.storageProvider === "supabase") {
    const storagePath = item.imagePath || item.imageUrl.split(`/storage/v1/object/public/${GALLERY_BUCKET}/`)[1];
    if (storagePath) {
      const { error: storageError } = await client.storage.from(GALLERY_BUCKET).remove([storagePath]);
      if (storageError) throw new Error(storageError.message);
    }
  }

  const { error: deleteError } = await client.from(GALLERY_TABLE).delete().eq("id", item.id);
  if (deleteError) throw new Error(deleteError.message);
};
