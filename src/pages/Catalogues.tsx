import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Expand, Eye, File, FileText, Filter, Image as ImageIcon, Loader2, MapPin, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { CATALOGUE_CATEGORIES, CatalogueItem, listCatalogueItems } from "@/lib/catalogues";

const getFileIcon = (type: CatalogueItem["fileType"]) => {
  if (type === "image") return ImageIcon;
  if (type === "pdf") return FileText;
  return File;
};

const formatBytes = (bytes: number) => {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

const getDownloadUrl = (fileUrl: string, fileName: string) => {
  const separator = fileUrl.includes("?") ? "&" : "?";
  return `${fileUrl}${separator}download=${encodeURIComponent(fileName || "catalogue-file")}`;
};

const Catalogues = () => {
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const [fullScreenState, setFullScreenState] = useState<{ category: string; index: number } | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listCatalogueItems();
        setItems(data);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Could not load catalogues.");
      } finally {
        setLoading(false);
      }
    };

    void fetchItems();
  }, []);

  const availableCategories = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];

    for (const knownCategory of CATALOGUE_CATEGORIES) {
      const normalized = knownCategory.trim();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      ordered.push(normalized);
    }

    for (const item of items) {
      const normalized = item.category.trim();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      ordered.push(normalized);
    }

    return ordered;
  }, [items]);

  const categoriesWithCounts = useMemo(
    () =>
      availableCategories.map((category) => ({
        category,
        count: items.filter((item) => item.category === category).length,
      })),
    [availableCategories, items],
  );

  const filteredItems = useMemo(() => {
    if (selectedCategory === "All") return items;
    return items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  const categoryItemsMap = useMemo(() => {
    const grouped: Record<string, CatalogueItem[]> = {};
    for (const item of items) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }
    return grouped;
  }, [items]);

  useEffect(() => {
    if (selectedCategory === "All") return;
    if (availableCategories.includes(selectedCategory)) return;
    setSelectedCategory("All");
  }, [availableCategories, selectedCategory]);

  useEffect(() => {
    if (!previewItemId) return;
    if (filteredItems.some((item) => item.id === previewItemId)) return;
    setPreviewItemId(null);
  }, [filteredItems, previewItemId]);

  const openFullScreen = (item: CatalogueItem) => {
    const categoryItems = categoryItemsMap[item.category] ?? [];
    const index = categoryItems.findIndex((categoryItem) => categoryItem.id === item.id);
    if (index === -1) return;
    setFullScreenState({ category: item.category, index });
  };

  const closeFullScreen = () => setFullScreenState(null);

  const fullScreenItems = fullScreenState ? categoryItemsMap[fullScreenState.category] ?? [] : [];
  const activeFullScreenItem = fullScreenState ? fullScreenItems[fullScreenState.index] : null;
  const canGoPrevious = Boolean(fullScreenState && fullScreenState.index > 0);
  const canGoNext = Boolean(fullScreenState && fullScreenState.index < fullScreenItems.length - 1);

  const goPrevious = () => {
    if (!fullScreenState || !canGoPrevious) return;
    setFullScreenState((current) => (current ? { ...current, index: Math.max(0, current.index - 1) } : current));
  };

  const goNext = () => {
    if (!fullScreenState || !canGoNext) return;
    setFullScreenState((current) =>
      current ? { ...current, index: Math.min((categoryItemsMap[current.category]?.length ?? 1) - 1, current.index + 1) } : current,
    );
  };

  useEffect(() => {
    if (!fullScreenState) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeFullScreen();
      if (event.key === "ArrowLeft") goPrevious();
      if (event.key === "ArrowRight") goNext();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fullScreenState, canGoNext, canGoPrevious]);

  const renderInlinePreview = (item: CatalogueItem) => {
    if (item.fileType === "image") {
      return (
        <img
          src={item.fileUrl}
          alt={item.title}
          loading="lazy"
          className="h-64 w-full rounded-md border border-border object-cover bg-background"
        />
      );
    }

    if (item.fileType === "pdf") {
      return (
        <iframe
          src={item.fileUrl}
          title={`${item.title} preview`}
          className="h-72 w-full rounded-md border border-border bg-background"
          loading="lazy"
        />
      );
    }

    return (
      <object
        data={item.fileUrl}
        type={item.mimeType || undefined}
        className="h-72 w-full rounded-md border border-border bg-background"
      >
        <div className="h-full w-full flex items-center justify-center text-center px-4 text-sm text-muted-foreground">
          Preview is not supported in this browser for this file type. Use Download.
        </div>
      </object>
    );
  };

  const renderFullScreenPreview = (item: CatalogueItem) => {
    if (item.fileType === "image") {
      return <img src={item.fileUrl} alt={item.title} className="max-h-[74vh] max-w-full object-contain rounded-md" />;
    }

    if (item.fileType === "pdf") {
      return <iframe src={item.fileUrl} title={`${item.title} full screen preview`} className="h-[74vh] w-full rounded-md bg-white" />;
    }

    return (
      <object data={item.fileUrl} type={item.mimeType || undefined} className="h-[74vh] w-full rounded-md bg-white">
        <div className="h-full w-full flex items-center justify-center text-center px-6 text-sm text-slate-700">
          This file cannot be previewed in full screen. Use Download.
        </div>
      </object>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-background to-beige/20">
      <Navbar />

      <section className="container mx-auto px-4 pt-28 pb-10 md:pt-32 md:pb-14">
        <div className="mb-8">
          <p className="text-accent text-sm tracking-[0.2em] uppercase font-medium mb-2">Product Library</p>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Catalogues & Accessories</h1>
          <p className="mt-3 text-muted-foreground max-w-3xl">
            Browse PDFs, brochures, images and supporting files for plywood sheets, doors, knobs, handles, laminates and more.
          </p>
          <a
            href="https://www.google.com/maps/search/?api=1&query=17.3830205714007,78.46422093592928"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-accent hover:underline"
          >
            <MapPin size={16} />
            Visit Store Location
          </a>
        </div>

        <div className="grid lg:grid-cols-[280px,1fr] gap-6">
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-xl border border-border bg-card p-4">
              <h2 className="font-heading text-lg font-semibold mb-3">Browse By Category</h2>
              <button
                type="button"
                onClick={() => setSelectedCategory("All")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left text-sm transition-colors ${
                  selectedCategory === "All" ? "bg-accent/15 text-accent" : "hover:bg-muted"
                }`}
              >
                <span>All Categories</span>
                <span className="text-xs">{items.length}</span>
              </button>
              <div className="mt-2 space-y-1">
                {categoriesWithCounts.map(({ category, count }) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left text-sm transition-colors ${
                      selectedCategory === category ? "bg-accent/15 text-accent" : "hover:bg-muted"
                    }`}
                  >
                    <span>{category}</span>
                    <span className="text-xs">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main>
            <div className="mb-4 rounded-xl border border-border bg-card p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Filter size={16} />
                  Filter by accessory type
                </div>
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="w-full md:w-80 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="All">All Categories</option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="rounded-xl border border-border bg-card py-16 flex items-center justify-center text-muted-foreground">
                <Loader2 className="animate-spin mr-2" size={18} />
                Loading catalogues...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">{error}</div>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <h3 className="font-heading text-xl mb-2">No files in this category yet</h3>
                <p className="text-muted-foreground text-sm">
                  Ask admin to upload catalogues for <span className="font-medium">{selectedCategory}</span>.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredItems.map((item) => {
                  const Icon = getFileIcon(item.fileType);
                  return (
                    <article key={item.id} className="rounded-xl border border-border bg-card p-4 flex flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 text-accent">
                          <Icon size={18} />
                          <span className="text-xs uppercase tracking-wide">{item.fileType}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCategory(item.category)}
                          className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
                        >
                          {item.category}
                        </button>
                      </div>
                      <h3 className="mt-3 font-semibold text-foreground line-clamp-2">{item.title}</h3>
                      <p className="text-xs text-muted-foreground mt-2">{item.fileName}</p>
                      {item.description ? <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.description}</p> : null}
                      <div className="mt-4 text-xs text-muted-foreground">{formatBytes(item.sizeBytes)}</div>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewItemId((current) => (current === item.id ? null : item.id))}
                          className="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-md border border-border text-xs font-semibold hover:border-accent/50 hover:text-accent transition-colors"
                        >
                          <Eye size={16} />
                          {previewItemId === item.id ? "Hide" : "View"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openFullScreen(item)}
                          className="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-md border border-border text-xs font-semibold hover:border-accent/50 hover:text-accent transition-colors"
                        >
                          <Expand size={16} />
                          Full
                        </button>
                        <a
                          href={getDownloadUrl(item.fileUrl, item.fileName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                        >
                          <Download size={16} />
                          Download
                        </a>
                      </div>
                      {previewItemId === item.id ? <div className="mt-3">{renderInlinePreview(item)}</div> : null}
                    </article>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </section>

      {activeFullScreenItem ? (
        <div className="fixed inset-0 z-[70] bg-black/90 p-3 md:p-8">
          <button
            type="button"
            onClick={closeFullScreen}
            className="absolute top-3 right-3 md:top-6 md:right-6 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
            aria-label="Close full screen preview"
          >
            <X size={20} />
          </button>

          <button
            type="button"
            onClick={goPrevious}
            disabled={!canGoPrevious}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/15 text-white hover:bg-white/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous file"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/15 text-white hover:bg-white/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next file"
          >
            <ChevronRight size={20} />
          </button>

          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="w-full max-w-6xl">{renderFullScreenPreview(activeFullScreenItem)}</div>
            <div className="text-center text-white px-6">
              <p className="text-lg font-semibold">{activeFullScreenItem.title}</p>
              <p className="text-sm text-white/80">
                {activeFullScreenItem.category} | {fullScreenState!.index + 1} / {fullScreenItems.length}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Catalogues;
