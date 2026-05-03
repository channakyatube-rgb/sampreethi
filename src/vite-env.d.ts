/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_CATALOGUE_BUCKET?: string;
  readonly VITE_SUPABASE_CATALOGUE_TABLE?: string;
  readonly VITE_SUPABASE_CATALOGUE_CATEGORIES_TABLE?: string;
  readonly VITE_SUPABASE_GALLERY_BUCKET?: string;
  readonly VITE_SUPABASE_GALLERY_TABLE?: string;
  readonly VITE_SUPABASE_GALLERY_CATEGORIES_TABLE?: string;
  readonly VITE_ADMIN_EMAILS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
