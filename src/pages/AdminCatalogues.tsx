import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.svg";
import {
  adminLogin,
  adminLogout,
  CATALOGUE_CATEGORIES,
  CatalogueItem,
  deleteCatalogueItem,
  getAdminSession,
  isSupabaseConfigured,
  listCatalogueCategories,
  listCatalogueItems,
  StorageProvider,
  SUPABASE_CONFIG_ERROR,
  uploadCatalogueFiles,
} from "@/lib/catalogues";
import { Cloud, HardDrive, Loader2, Lock, LogOut, Server, Trash2, UploadCloud } from "lucide-react";

const ADD_NEW_CATEGORY_VALUE = "__new_category__";

const STORAGE_OPTIONS: {
  value: StorageProvider;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: "supabase",
    label: "Supabase",
    description: "Best for small files under 50 MB",
    icon: <Server size={14} />,
    color: "border-green-400 bg-green-50 text-green-700",
  },
  {
    value: "r2",
    label: "Cloudflare R2",
    description: "Best for large files — no size limit",
    icon: <Cloud size={14} />,
    color: "border-orange-400 bg-orange-50 text-orange-700",
  },
  {
    value: "drive",
    label: "Google Drive",
    description: "15 GB free — great for large catalogues",
    icon: <HardDrive size={14} />,
    color: "border-blue-400 bg-blue-50 text-blue-700",
  },
];

const mergeCategoryOptions = (...groups: string[][]) => {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const group of groups) {
    for (const rawCategory of group) {
      const normalized = rawCategory.trim();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      ordered.push(normalized);
    }
  }
  return ordered;
};

const getDefaultCategory = (categories: string[]) =>
  categories.find((c) => c !== "Other") ?? categories[0] ?? "Other";

const AdminCatalogues = () => {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [actionError, setActionError] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<string[]>(() =>
    mergeCategoryOptions(CATALOGUE_CATEGORIES)
  );
  const [category, setCategory] = useState<string>(() =>
    getDefaultCategory(mergeCategoryOptions(CATALOGUE_CATEGORIES))
  );
  const [customCategory, setCustomCategory] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [storageProvider, setStorageProvider] = useState<StorageProvider>("r2");

  const loadItems = async () => {
    setIsLoadingItems(true);
    setActionError("");
    try {
      const [data, savedCategories] = await Promise.all([
        listCatalogueItems(),
        listCatalogueCategories(),
      ]);
      setItems(data);
      setCategoryOptions(
        mergeCategoryOptions(
          CATALOGUE_CATEGORIES,
          savedCategories,
          data.map((item) => item.category)
        )
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not load catalogue items."
      );
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    if (category === ADD_NEW_CATEGORY_VALUE) return;
    if (categoryOptions.includes(category)) return;
    setCategory(getDefaultCategory(categoryOptions));
  }, [category, categoryOptions]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getAdminSession();
        setIsAuthed(session);
        if (session) await loadItems();
      } finally {
        setIsCheckingSession(false);
      }
    };
    void checkSession();
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError("");
    setLoginLoading(true);
    try {
      await adminLogin(loginEmail, loginPassword);
      setIsAuthed(true);
      setLoginPassword("");
      await loadItems();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(event.target.files ?? []));
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError("");
    setUploading(true);

    const providerLabel =
      STORAGE_OPTIONS.find((o) => o.value === storageProvider)?.label ?? storageProvider;
    setUploadProgress(`Uploading to ${providerLabel}...`);

    try {
      const resolvedCategory =
        category === ADD_NEW_CATEGORY_VALUE ? customCategory.trim() : category.trim();
      if (!resolvedCategory) throw new Error("Please enter a new category name.");

      await uploadCatalogueFiles({
        title: title.trim(),
        description: description.trim(),
        category: resolvedCategory,
        files,
        storageProvider,
      });

      setTitle("");
      setDescription("");
      setCategory(getDefaultCategory(categoryOptions));
      setCustomCategory("");
      setFiles([]);
      setUploadProgress("");
      await loadItems();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Upload failed.");
      setUploadProgress("");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: CatalogueItem) => {
    const confirmed = window.confirm(`Delete "${item.title}"? This cannot be undone.`);
    if (!confirmed) return;
    setActionError("");
    try {
      await deleteCatalogueItem(item);
      await loadItems();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Delete failed.");
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    setIsAuthed(false);
    setItems([]);
    setLoginEmail("");
    setLoginPassword("");
  };

  const getProviderBadge = (provider: StorageProvider) => {
    const opt = STORAGE_OPTIONS.find((o) => o.value === provider);
    if (!opt) return null;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${opt.color}`}
      >
        {opt.icon}
        {opt.label}
      </span>
    );
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        <Loader2 className="animate-spin mr-2" size={18} />
        Checking admin access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-cream to-background">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Sampreethi Plywood & Veneer" className="h-12 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/catalogues"
              className="px-4 py-2 text-sm font-semibold rounded-md border border-border hover:border-accent/50 hover:text-accent transition-colors"
            >
              Admin Catalogue
            </Link>
            <Link
              to="/admin/gallery"
              className="px-4 py-2 text-sm font-semibold rounded-md border border-border hover:border-accent/50 hover:text-accent transition-colors"
            >
              Admin Gallery
            </Link>
            {isAuthed && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-10">
        {!isAuthed ? (
          <div className="max-w-md mx-auto rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 text-primary mb-4">
              <Lock size={18} />
              <h1 className="font-heading text-2xl font-semibold">Admin Access</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Only admin users can upload or manage catalogue files.
            </p>
            {!isSupabaseConfigured && (
              <div className="text-xs rounded-md border border-accent/40 bg-accent/10 p-3 mb-4 text-foreground/80">
                {SUPABASE_CONFIG_ERROR}
              </div>
            )}
            <form className="space-y-3" onSubmit={handleLogin}>
              <input
                type="email"
                required
                placeholder="Admin email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="submit"
                disabled={loginLoading || !isSupabaseConfigured}
                className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {loginLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
            {actionError && <p className="mt-3 text-sm text-destructive">{actionError}</p>}
          </div>
        ) : (
          <div className="grid xl:grid-cols-[400px,1fr] gap-6">
            {/* Upload Form */}
            <div className="rounded-2xl border border-border bg-card p-6 h-fit">
              <div className="flex items-center gap-2 text-primary mb-4">
                <UploadCloud size={18} />
                <h2 className="font-heading text-xl font-semibold">Upload New Catalogue</h2>
              </div>

              <form className="space-y-3" onSubmit={handleUpload}>
                {/* Storage Provider Selector */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                    Storage Provider
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {STORAGE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setStorageProvider(opt.value);
                          setActionError("");
                          setUploadProgress("");
                        }}
                        className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                          storageProvider === opt.value
                            ? opt.color + " border-current"
                            : "border-border text-muted-foreground hover:border-accent/40"
                        }`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {STORAGE_OPTIONS.find((o) => o.value === storageProvider)?.description}
                  </p>
                </div>

                <input
                  type="text"
                  placeholder="Title (optional, defaults to file name)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <textarea
                  placeholder="Short description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value={ADD_NEW_CATEGORY_VALUE}>Add New Category...</option>
                </select>
                {category === ADD_NEW_CATEGORY_VALUE && (
                  <input
                    type="text"
                    required
                    placeholder="Enter new category name"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                )}
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                  onChange={handleFilesChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-accent/20 file:px-2 file:py-1 file:text-accent file:font-semibold"
                />
                <button
                  type="submit"
                  disabled={uploading || files.length === 0}
                  className="w-full rounded-md bg-accent text-accent-foreground py-2.5 text-sm font-semibold hover:bg-accent/90 disabled:opacity-60 transition-colors"
                >
                  {uploading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      {uploadProgress || "Uploading..."}
                    </span>
                  ) : (
                    "Upload Files"
                  )}
                </button>
              </form>

              <p className="text-xs text-muted-foreground mt-3">
                Supports PDF, images and office documents. Use R2 or Google Drive for files over 50 MB.
              </p>
              {actionError && (
                <p className="mt-2 text-sm text-destructive">{actionError}</p>
              )}
            </div>

            {/* Uploaded Files List */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-heading text-xl font-semibold">Uploaded Files</h2>
                {isLoadingItems ? (
                  <span className="inline-flex items-center text-sm text-muted-foreground">
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Loading...
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">{items.length} files</span>
                )}
              </div>

              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
                  No catalogue files uploaded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.fileName}</p>
                        <div className="mt-1">
                          {getProviderBadge(item.storageProvider)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 text-xs font-semibold rounded-md border border-border hover:border-accent/50 hover:text-accent transition-colors"
                        >
                          Open
                        </a>
                        <button
                          type="button"
                          onClick={() => void handleDelete(item)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminCatalogues;
