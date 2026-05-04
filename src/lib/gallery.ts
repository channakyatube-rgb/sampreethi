import { createClient } from "@supabase/supabase-js";

export type GalleryCategory = string;

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  imagePath?: string;
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
}

interface SupabaseCategoryRow {
  name: string;
}

export interface GalleryUploadPayload {
  title: string;
  description: string;
  category: string;
  files: File[];
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const resolveEnvValue = (value: string | undefined, fallback: string) => {
  const normalizedValue = value?.trim();
  return normalizedValue && normalizedValue.length > 0 ? normalizedValue : fallback;
};

const GALLERY_BUCKET = resolveEnvValue(import.meta.env.VITE_SUPABASE_GALLERY_BUCKET, "gallery");
const GALLERY_TABLE = resolveEnvValue(import.meta.env.VITE_SUPABASE_GALLERY_TABLE, "gallery_images");
const GALLERY_CATEGORIES_TABLE = resolveEnvValue(import.meta.env.VITE_SUPABASE_GALLERY_CATEGORIES_TABLE, "gallery_categories");
const STORAGE_BUCKET_NOT_FOUND_ERROR = "bucket not found";
const SQL_TABLE_MISSING_ERROR_CODE = "42P01";

export const GALLERY_CATEGORIES: GalleryCategory[] = [
  "Kitchens",
  "Wardrobes",
  "Living Rooms",
  "Pooja Rooms",
  "Bedrooms",
  "Dining Rooms",
  "Office Spaces",
  "Other",
];

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

const formatStorageError = (message: string) => {
  const normalizedMessage = message.toLowerCase();
  if (normalizedMessage.includes(STORAGE_BUCKET_NOT_FOUND_ERROR)) {
    return `Storage bucket "${GALLERY_BUCKET}" was not found. Create this bucket in Supabase Storage or update VITE_SUPABASE_GALLERY_BUCKET to match the existing bucket id.`;
  }
  return message;
};

const mapSupabaseRow = (row: SupabaseGalleryRow): GalleryItem => ({
  id: row.id,
  title: row.title,
  category: normalizeCategory(row.category),
  description: row.description ?? "",
  imageUrl: row.image_url,
  fileName: row.file_name ?? "gallery-image",
  mimeType: row.mime_type ?? "",
  sizeBytes: row.size_bytes ?? 0,
  createdAt: row.created_at,
  imagePath: row.image_path ?? undefined,
});

export const listGalleryItems = async (): Promise<GalleryItem[]> => {
  const client = getSupabase();
  const { data, error } = await client.from(GALLERY_TABLE).select("*").order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data as SupabaseGalleryRow[]) ?? []).map(mapSupabaseRow);
};

export const listGalleryCategories = async (): Promise<string[]> => {
  const client = getSupabase();
  const { data, error } = await client.from(GALLERY_CATEGORIES_TABLE).select("name").order("name", { ascending: true });

  if (error) {
    if (error.code === SQL_TABLE_MISSING_ERROR_CODE) {
      return [...GALLERY_CATEGORIES];
    }
    throw new Error(error.message);
  }

  const savedCategories = ((data as SupabaseCategoryRow[]) ?? []).map((row) => normalizeCategory(row.name));
  return mergeCategories(GALLERY_CATEGORIES, savedCategories);
};

const saveGalleryCategory = async (client: ReturnType<typeof getSupabase>, category: string) => {
  const normalized = normalizeCategory(category);
  const { error } = await client
    .from(GALLERY_CATEGORIES_TABLE)
    .upsert(
      {
        name: normalized,
      },
      {
        onConflict: "name",
        ignoreDuplicates: true,
      },
    );

  if (error && error.code !== SQL_TABLE_MISSING_ERROR_CODE) {
    throw new Error(error.message);
  }
};

export const uploadGalleryImages = async (payload: GalleryUploadPayload) => {
  if (payload.files.length === 0) {
    throw new Error("Please choose at least one image.");
  }

  const client = getSupabase();
  const normalizedCategory = normalizeCategory(payload.category);
  await saveGalleryCategory(client, normalizedCategory);
  const uploadedRows: SupabaseGalleryRow[] = [];

  for (const file of payload.files) {
    if (!file.type.startsWith("image/")) {
      throw new Error(`"${file.name}" is not an image file.`);
    }

    const categoryFolder = sanitizeCategoryFolder(normalizedCategory);
    const filePath = `${categoryFolder}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await client.storage.from(GALLERY_BUCKET).upload(filePath, file, {
      upsert: false,
    });
    if (uploadError) throw new Error(formatStorageError(uploadError.message));

    const { data: publicData } = client.storage.from(GALLERY_BUCKET).getPublicUrl(filePath);

    const rowPayload = {
      title: payload.title || file.name.replace(/\.[^/.]+$/, ""),
      category: normalizedCategory,
      description: payload.description,
      file_name: file.name,
      image_url: publicData.publicUrl,
      image_path: filePath,
      mime_type: file.type,
      size_bytes: file.size,
    };

    const { data, error: insertError } = await client.from(GALLERY_TABLE).insert(rowPayload).select("*").single();
    if (insertError) throw new Error(insertError.message);

    uploadedRows.push(data as SupabaseGalleryRow);
  }

  return uploadedRows.map(mapSupabaseRow);
};

export const deleteGalleryItem = async (item: GalleryItem) => {
  const client = getSupabase();
  if (item.imagePath) {
    const { error: storageError } = await client.storage.from(GALLERY_BUCKET).remove([item.imagePath]);
    if (storageError) throw new Error(formatStorageError(storageError.message));
  }

  const { error: deleteError } = await client.from(GALLERY_TABLE).delete().eq("id", item.id);
  if (deleteError) throw new Error(deleteError.message);
};
