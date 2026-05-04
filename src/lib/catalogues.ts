import { createClient } from "@supabase/supabase-js";

export type CatalogueCategory = string;
export type CatalogueFileType = "image" | "pdf" | "file";
export type StorageProvider = "supabase" | "r2" | "drive";

export interface CatalogueItem {
  id: string;
  title: string;
  description: string;
  category: string;
  fileName: string;
  fileUrl: string;
  fileType: CatalogueFileType;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  filePath?: string;
  storageProvider: StorageProvider;
}

export interface UploadPayload {
  title: string;
  description: string;
  category: string;
  files: File[];
  storageProvider: StorageProvider;
}

interface SupabaseCatalogueRow {
  id: string;
  title: string;
  category: string;
  description: string | null;
  file_name: string | null;
  file_url: string;
  file_path: string | null;
  file_type: string | null;
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
const CATALOGUE_BUCKET = resolveEnvValue(import.meta.env.VITE_SUPABASE_CATALOGUE_BUCKET, "catalogues");
const CATALOGUE_TABLE = resolveEnvValue(import.meta.env.VITE_SUPABASE_CATALOGUE_TABLE, "catalogue_files");
const CATALOGUE_CATEGORIES_TABLE = resolveEnvValue(import.meta.env.VITE_SUPABASE_CATALOGUE_CATEGORIES_TABLE, "catalogue_categories");

const configuredAdminEmails = (import.meta.env.VITE_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const CATALOGUE_CATEGORIES: CatalogueCategory[] = [
  "Plywood Sheets",
  "Doors",
  "Door Knobs",
  "Handles",
  "Door Handles",
  "Laminates",
  "Veneers",
  "Wardrobe Hardware",
  "Kitchen Accessories",
  "More Accessories",
  "Other",
];

export const SUPABASE_CONFIG_ERROR =
  "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment (.env.local for local, Netlify Environment Variables for production).";

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

export const isSupabaseConfigured = Boolean(supabase);

const getSupabase = () => {
  if (!supabase) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }
  return supabase;
};

const parseCategory = (category: string) => category.trim() || "Other";

const mergeCategories = (...groups: string[]) => {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const category of groups) {
    const normalized = parseCategory(category);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    ordered.push(normalized);
  }

  return ordered;
};

const isAdminEmail = (email: string | null | undefined) => {
  if (!email) return false;
  if (configuredAdminEmails.length === 0) return true;
  return configuredAdminEmails.includes(email.toLowerCase());
};

const parseFileType = (mimeType: string, fileName: string, explicitType?: string | null): CatalogueFileType => {
  if (explicitType === "image" || explicitType === "pdf" || explicitType === "file") {
    return explicitType;
  }

  const normalizedMime = (mimeType || "").toLowerCase();
  if (normalizedMime.startsWith("image/")) return "image";
  if (normalizedMime === "application/pdf") return "pdf";

  const extension = fileName.toLowerCase().split(".").pop() ?? "";
  if (["png", "jpg", "jpeg", "webp", "gif", "avif", "bmp", "svg"].includes(extension)) return "image";
  if (extension === "pdf") return "pdf";

  return "file";
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

const mapSupabaseRow = (row: SupabaseCatalogueRow): CatalogueItem => {
  const fileName = row.file_name ?? row.file_url.split("/").pop() ?? "catalogue-file";
  const mimeType = row.mime_type ?? "";
  return {
    id: row.id,
    title: row.title,
    category: parseCategory(row.category),
    description: row.description ?? "",
    fileName,
    fileUrl: row.file_url,
    filePath: row.file_path ?? undefined,
    fileType: parseFileType(mimeType, fileName, row.file_type),
    mimeType,
    sizeBytes: row.size_bytes ?? 0,
    createdAt: row.created_at,
    storageProvider: (row.storage_provider as StorageProvider) ?? "supabase",
  };
};

const insertCatalogueRow = async (
  client: ReturnType<typeof getSupabase>,
  payload: Record<string, unknown>,
  storageProvider: StorageProvider,
) => {
  const withProvider = {
    ...payload,
    storage_provider: storageProvider,
  };

  let { error } = await client.from(CATALOGUE_TABLE).insert(withProvider);
  if (error && isMissingStorageProviderColumnError(error.message, error.code)) {
    ({ error } = await client.from(CATALOGUE_TABLE).insert(payload));
  }

  if (error) {
    throw new Error(error.message);
  }
};

const uploadFileToSupabase = async (client: ReturnType<typeof getSupabase>, file: File, category: string) => {
  const categoryFolder = sanitizeCategoryFolder(category);
  const filePath = `${categoryFolder}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const { error } = await client.storage.from(CATALOGUE_BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = client.storage.from(CATALOGUE_BUCKET).getPublicUrl(filePath);
  return {
    fileUrl: data.publicUrl,
    filePath,
  };
};

const uploadFileToR2 = async (file: File, category: string): Promise<string> => {
  const res = await fetch("/.netlify/functions/get-r2-upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      category,
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
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`R2 upload failed: ${uploadRes.statusText}`);
  }

  return publicUrl;
};

const uploadFileToDrive = async (file: File, category: string): Promise<string> => {
  const tokenRes = await fetch("/.netlify/functions/get-drive-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category }),
  });

  if (!tokenRes.ok) {
    if (tokenRes.status === 404) {
      throw new Error("Netlify function get-drive-token was not found. Run the app with `netlify dev` so /.netlify/functions routes are available.");
    }
    const err = await tokenRes.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to get Drive token");
  }

  const { token, folderId } = await tokenRes.json();

  const initRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Upload-Content-Type": file.type || "application/pdf",
      "X-Upload-Content-Length": String(file.size),
    },
    body: JSON.stringify({
      name: file.name,
      parents: [folderId],
    }),
  });

  if (!initRes.ok) {
    throw new Error(`Drive session init failed: ${initRes.statusText}`);
  }

  const resumableUrl = initRes.headers.get("Location");
  if (!resumableUrl) throw new Error("No resumable upload URL returned by Drive");

  const uploadRes = await fetch(resumableUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/pdf",
      "Content-Length": String(file.size),
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`Drive upload failed: ${uploadRes.statusText}`);
  }

  const driveFile = await uploadRes.json();
  const fileId: string = driveFile.id;

  const pubRes = await fetch("/.netlify/functions/make-drive-file-public", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileId, token }),
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

export const getAdminSession = async (): Promise<boolean> => {
  if (!supabase) return false;

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) return false;

  return isAdminEmail(data.session.user.email);
};

export const adminLogin = async (email: string, password: string) => {
  const client = getSupabase();

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  if (!isAdminEmail(data.user?.email)) {
    await client.auth.signOut();
    throw new Error("This account is not allowed for admin uploads.");
  }
};

export const adminLogout = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
};

export const listCatalogueItems = async (): Promise<CatalogueItem[]> => {
  const client = getSupabase();
  const { data, error } = await client.from(CATALOGUE_TABLE).select("*").order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data as SupabaseCatalogueRow[]) ?? []).map(mapSupabaseRow);
};

export const listCatalogueCategories = async (): Promise<string[]> => {
  const client = getSupabase();

  const { data: categoryRows, error: categoryError } = await client
    .from(CATALOGUE_CATEGORIES_TABLE)
    .select("name")
    .order("name", { ascending: true });

  if (!categoryError) {
    const savedCategories = ((categoryRows as SupabaseCategoryRow[]) ?? []).map((row) => parseCategory(row.name));
    return mergeCategories(...CATALOGUE_CATEGORIES, ...savedCategories);
  }

  const { data: tableRows, error: tableError } = await client.from(CATALOGUE_TABLE).select("category");
  if (tableError) return [...CATALOGUE_CATEGORIES];

  const tableCategories = ((tableRows as { category: string }[]) ?? []).map((row) => parseCategory(row.category));
  return mergeCategories(...CATALOGUE_CATEGORIES, ...tableCategories);
};

export const uploadCatalogueFiles = async (payload: UploadPayload) => {
  if (payload.files.length === 0) {
    throw new Error("Please choose at least one file.");
  }

  const client = getSupabase();
  const normalizedCategory = parseCategory(payload.category);

  for (const file of payload.files) {
    let fileUrl = "";
    let filePath = "";

    if (payload.storageProvider === "r2") {
      fileUrl = await uploadFileToR2(file, normalizedCategory);
      filePath = `r2:${file.name}`;
    } else if (payload.storageProvider === "drive") {
      fileUrl = await uploadFileToDrive(file, normalizedCategory);
      filePath = `drive:${file.name}`;
    } else {
      const uploadData = await uploadFileToSupabase(client, file, normalizedCategory);
      fileUrl = uploadData.fileUrl;
      filePath = uploadData.filePath;
    }

    const rowPayload = {
      title: payload.title || file.name.replace(/\.[^/.]+$/, ""),
      category: normalizedCategory,
      description: payload.description,
      file_name: file.name,
      file_url: fileUrl,
      file_path: filePath,
      file_type: parseFileType(file.type, file.name),
      mime_type: file.type,
      size_bytes: file.size,
    };

    await insertCatalogueRow(client, rowPayload, payload.storageProvider);
  }
};

export const deleteCatalogueItem = async (item: CatalogueItem) => {
  const client = getSupabase();

  if (item.storageProvider === "supabase") {
    const storagePath = item.filePath || item.fileUrl.split(`/storage/v1/object/public/${CATALOGUE_BUCKET}/`)[1];
    if (storagePath) {
      const { error: storageError } = await client.storage.from(CATALOGUE_BUCKET).remove([storagePath]);
      if (storageError) throw new Error(storageError.message);
    }
  }

  const { error: deleteError } = await client.from(CATALOGUE_TABLE).delete().eq("id", item.id);
  if (deleteError) throw new Error(deleteError.message);
};
