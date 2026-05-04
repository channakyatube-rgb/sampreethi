import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { adminLogin, adminLogout, getAdminSession, isSupabaseConfigured, SUPABASE_CONFIG_ERROR } from "@/lib/catalogues";
import {
  deleteGalleryItem,
  GALLERY_CATEGORIES,
  GalleryItem,
  listGalleryCategories,
  listGalleryItems,
  uploadGalleryImages,
} from "@/lib/gallery";
import { ImagePlus, Loader2, Lock, LogOut, Trash2 } from "lucide-react";

const ADD_NEW_CATEGORY_VALUE = "__new_category__";

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

const getDefaultCategory = (categories: string[]) => categories.find((category) => category !== "Other") ?? categories[0] ?? "Other";

const AdminGallery = () => {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [actionError, setActionError] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<string[]>(() => mergeCategoryOptions(GALLERY_CATEGORIES));
  const [category, setCategory] = useState<string>(() => getDefaultCategory(mergeCategoryOptions(GALLERY_CATEGORIES)));
  const [customCategory, setCustomCategory] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const loadItems = async () => {
    setIsLoadingItems(true);
    setActionError("");
    try {
      const [data, savedCategories] = await Promise.all([listGalleryItems(), listGalleryCategories()]);
      setItems(data);
      setCategoryOptions(mergeCategoryOptions(GALLERY_CATEGORIES, savedCategories, data.map((item) => item.category)));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not load gallery images.");
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
        if (session) {
          await loadItems();
        }
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
    const selectedFiles = Array.from(event.target.files ?? []);
    setFiles(selectedFiles);
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError("");
    setUploading(true);
    try {
      const resolvedCategory = category === ADD_NEW_CATEGORY_VALUE ? customCategory.trim() : category.trim();
      if (!resolvedCategory) {
        throw new Error("Please enter a new category name.");
      }

      await uploadGalleryImages({
        title: title.trim(),
        description: description.trim(),
        category: resolvedCategory,
        files,
      });

      setTitle("");
      setDescription("");
      setCategory(getDefaultCategory(categoryOptions));
      setCustomCategory("");
      setFiles([]);
      await loadItems();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    const confirmed = window.confirm(`Delete "${item.title}" from gallery? This cannot be undone.`);
    if (!confirmed) return;
    setActionError("");
    try {
      await deleteGalleryItem(item);
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
            {isAuthed ? (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            ) : null}
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
              Only admin users can upload or manage gallery images.
            </p>
            {!isSupabaseConfigured ? (
              <div className="text-xs rounded-md border border-accent/40 bg-accent/10 p-3 mb-4 text-foreground/80">
                {SUPABASE_CONFIG_ERROR}
              </div>
            ) : null}
            <form className="space-y-3" onSubmit={handleLogin}>
              <input
                type="email"
                required
                placeholder="Admin email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
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
            {actionError ? <p className="mt-3 text-sm text-destructive">{actionError}</p> : null}
          </div>
        ) : (
          <div className="grid xl:grid-cols-[380px,1fr] gap-6">
            <div className="rounded-2xl border border-border bg-card p-6 h-fit">
              <div className="flex items-center gap-2 text-primary mb-4">
                <ImagePlus size={18} />
                <h2 className="font-heading text-xl font-semibold">Upload Gallery Images</h2>
              </div>
              <form className="space-y-3" onSubmit={handleUpload}>
                <input
                  type="text"
                  placeholder="Title (optional, defaults to file name)"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <textarea
                  placeholder="Short description"
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {categoryOptions.map((galleryCategory) => (
                    <option key={galleryCategory} value={galleryCategory}>
                      {galleryCategory}
                    </option>
                  ))}
                  <option value={ADD_NEW_CATEGORY_VALUE}>Add New Category...</option>
                </select>
                {category === ADD_NEW_CATEGORY_VALUE ? (
                  <input
                    type="text"
                    required
                    placeholder="Enter new category name"
                    value={customCategory}
                    onChange={(event) => setCustomCategory(event.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                ) : null}
                <input
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.webp,.gif,.avif"
                  onChange={handleFilesChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-accent/20 file:px-2 file:py-1 file:text-accent file:font-semibold"
                />
                <button
                  type="submit"
                  disabled={uploading || files.length === 0}
                  className="w-full rounded-md bg-accent text-accent-foreground py-2.5 text-sm font-semibold hover:bg-accent/90 disabled:opacity-60 transition-colors"
                >
                  {uploading ? "Uploading..." : "Upload Images"}
                </button>
              </form>
              <p className="text-xs text-muted-foreground mt-3">
                Upload gallery photos and manage categories. New categories are saved for future uploads.
              </p>
              {actionError ? <p className="mt-2 text-sm text-destructive">{actionError}</p> : null}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-heading text-xl font-semibold">Gallery Images</h2>
                {isLoadingItems ? (
                  <span className="inline-flex items-center text-sm text-muted-foreground">
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Loading...
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">{items.length} images</span>
                )}
              </div>

              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
                  No gallery images uploaded yet.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border p-2 flex flex-col gap-2">
                      <img src={item.imageUrl} alt={item.title} className="w-full aspect-[4/3] object-cover rounded-md" loading="lazy" />
                      <div>
                        <p className="font-medium text-foreground text-sm line-clamp-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.category}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.fileName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={item.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 text-xs font-semibold rounded-md border border-border hover:border-accent/50 hover:text-accent transition-colors flex-1 text-center"
                        >
                          Open
                        </a>
                        <button
                          type="button"
                          onClick={() => void handleDelete(item)}
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        >
                          <Trash2 size={13} />
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

export default AdminGallery;
