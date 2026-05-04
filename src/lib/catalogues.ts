import { createClient } from "@supabase/supabase-js";

export type CatalogueCategory = string;

export type CatalogueFileType = "image" | "pdf" | "file";

export interface CatalogueItem {
  id: string;
  title: string;
  category: string;
  description: string;
  fileName: string;
  fileUrl: string;
  fileType: CatalogueFileType;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  filePath?: string;
}

interface SupabaseCatalogueRow {
  id: string;
  title: string;
  category: string;
  description: string | null;
  file_name: string | null;
  file_url: string;
  file_path: string | null;
  file_type: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

interface SupabaseCategoryRow {
  name: string;
}

export interface UploadPayload {
  title: string;
  description: string;
  category: string;
  files: File[];
}

const resolveEnvValue = (value: string | undefined, fallback: string) => {
  const normalizedValue = value?.trim();
  return normalizedValue && normalizedValue.length > 0 ? normalizedValue : fallback;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const CATALOGUE_BUCKET = resolveEnvValue(import.meta.env.VITE_SUPABASE_CATALOGUE_BUCKET, "catalogues");
const CATALOGUE_TABLE = resolveEnvValue(import.meta.env.VITE_SUPABASE_CATALOGUE_TABLE, "catalogue_files");
const CATALOGUE_CATEGORIES_TABLE = resolveEnvValue(import.meta.env.VITE_SUPABASE_CATALOGUE_CATEGORIES_TABLE, "catalogue_categories");
const ADMIN_USERS_TABLE = "admin_users";
const configuredAdminEmails = (import.meta.env.VITE_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

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
const ADMIN_ROW_MISSING_ERROR =
  "Admin access is not enabled for this account in Supabase. Add this user ID to public.admin_users and sign in again:";
const ADMIN_SESSION_MISSING_ERROR = "Admin session expired. Please sign in again.";
const ADMIN_RLS_ERROR = "new row violates row-level security policy";
const STORAGE_BUCKET_NOT_FOUND_ERROR = "bucket not found";
const SQL_TABLE_MISSING_ERROR_CODE = "42P01";

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

const parseFileType = (mimeType: string): CatalogueFileType => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return "file";
};

const sanitizeFileName = (name: string) => name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-");
const sanitizeCategoryFolder = (category: string) =>
  category
    .toLowerCase()
    .replace(/[^a-z0-9\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "other";

const isAdminEmail = (email: string | null | undefined) => {
  if (!email) return false;
  if (configuredAdminEmails.length === 0) return true;
  return configuredAdminEmails.includes(email.toLowerCase());
};

const formatAdminAuthError = (message: string, userId: string) => {
  const normalizedMessage = message.toLowerCase();
  if (normalizedMessage.includes(ADMIN_RLS_ERROR)) {
    return `${ADMIN_ROW_MISSING_ERROR} ${userId}`;
  }
  return message;
};

const formatStorageError = (message: string) => {
  const normalizedMessage = message.toLowerCase();
  if (normalizedMessage.includes(STORAGE_BUCKET_NOT_FOUND_ERROR)) {
    return `Storage bucket "${CATALOGUE_BUCKET}" was not found. Create this bucket in Supabase Storage or update VITE_SUPABASE_CATALOGUE_BUCKET to match the existing bucket id.`;
  }
  return message;
};

const ensureAdminUser = async (client: ReturnType<typeof getSupabase>) => {
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  const user = sessionData.session?.user;

  if (sessionError || !user) {
    throw new Error(ADMIN_SESSION_MISSING_ERROR);
  }

  if (!isAdminEmail(user.email)) {
    throw new Error("This account is not allowed for admin uploads.");
  }

  const { data: adminRow, error: adminError } = await client
    .from(ADMIN_USERS_TABLE)
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (adminError) {
    throw new Error(formatAdminAuthError(adminError.message, user.id));
  }

  if (!adminRow) {
    throw new Error(`${ADMIN_ROW_MISSING_ERROR} ${user.id}`);
  }

  return user;
};

const mapSupabaseRow = (row: SupabaseCatalogueRow): CatalogueItem => ({
  id: row.id,
  title: row.title,
  category: parseCategory(row.category),
  description: row.description ?? "",
  fileName: row.file_name ?? "catalogue-file",
  fileUrl: row.file_url,
  fileType: row.file_type as CatalogueFileType,
  mimeType: row.mime_type ?? "",
  sizeBytes: row.size_bytes ?? 0,
  createdAt: row.created_at,
  filePath: row.file_path ?? undefined,
});

export const getAdminSession = async (): Promise<boolean> => {
  if (!supabase) return false;
  try {
    await ensureAdminUser(supabase);
    return true;
  } catch {
    return false;
  }
};

export const adminLogin = async (email: string, password: string) => {
  const client = getSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!isAdminEmail(data.user?.email)) {
    await client.auth.signOut();
    throw new Error("This account is not allowed for admin uploads.");
  }

  try {
    await ensureAdminUser(client);
  } catch (adminError) {
    await client.auth.signOut();
    throw adminError;
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
  const { data, error } = await client.from(CATALOGUE_CATEGORIES_TABLE).select("name").order("name", { ascending: true });

  if (error) {
    if (error.code === SQL_TABLE_MISSING_ERROR_CODE) {
      return [...CATALOGUE_CATEGORIES];
    }
    throw new Error(error.message);
  }

  const savedCategories = ((data as SupabaseCategoryRow[]) ?? []).map((row) => parseCategory(row.name));
  return mergeCategories(...CATALOGUE_CATEGORIES, ...savedCategories);
};

const saveCatalogueCategory = async (client: ReturnType<typeof getSupabase>, category: string, userId: string) => {
  const normalizedCategory = parseCategory(category);
  const { error } = await client
    .from(CATALOGUE_CATEGORIES_TABLE)
    .upsert(
      {
        name: normalizedCategory,
        created_by: userId,
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

export const uploadCatalogueFiles = async (payload: UploadPayload) => {
  if (payload.files.length === 0) {
    throw new Error("Please choose at least one file.");
  }

  const client = getSupabase();
  const adminUser = await ensureAdminUser(client);
  const normalizedCategory = parseCategory(payload.category);
  await saveCatalogueCategory(client, normalizedCategory, adminUser.id);
  const uploadedRows: SupabaseCatalogueRow[] = [];

  for (const file of payload.files) {
    const categoryFolder = sanitizeCategoryFolder(normalizedCategory);
    const filePath = `${categoryFolder}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await client.storage.from(CATALOGUE_BUCKET).upload(filePath, file, {
      upsert: false,
    });
    if (uploadError) throw new Error(formatAdminAuthError(formatStorageError(uploadError.message), adminUser.id));

    const { data: publicData } = client.storage.from(CATALOGUE_BUCKET).getPublicUrl(filePath);
    const fileUrl = publicData.publicUrl;

    const rowPayload = {
      title: payload.title || file.name.replace(/\.[^/.]+$/, ""),
      category: normalizedCategory,
      description: payload.description,
      file_name: file.name,
      file_url: fileUrl,
      file_path: filePath,
      file_type: parseFileType(file.type),
      mime_type: file.type,
      size_bytes: file.size,
    };

    const { data, error: insertError } = await client.from(CATALOGUE_TABLE).insert(rowPayload).select("*").single();
    if (insertError) throw new Error(formatAdminAuthError(insertError.message, adminUser.id));

    uploadedRows.push(data as SupabaseCatalogueRow);
  }

  return uploadedRows.map(mapSupabaseRow);
};

export const deleteCatalogueItem = async (item: CatalogueItem) => {
  const client = getSupabase();
  const adminUser = await ensureAdminUser(client);
  if (item.filePath) {
    const { error: storageError } = await client.storage.from(CATALOGUE_BUCKET).remove([item.filePath]);
    if (storageError) throw new Error(formatAdminAuthError(formatStorageError(storageError.message), adminUser.id));
  }

  const { error: deleteError } = await client.from(CATALOGUE_TABLE).delete().eq("id", item.id);
  if (deleteError) throw new Error(formatAdminAuthError(deleteError.message, adminUser.id));
};
