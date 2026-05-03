import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Expand, Filter, Loader2, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { GalleryItem, isGallerySupabaseConfigured, listGalleryCategories, listGalleryItems } from "@/lib/gallery";

const mergeCategories = (...groups: string[][]) => {
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

const Gallery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(() => searchParams.get("category")?.trim() || "All");
  const [lightboxState, setLightboxState] = useState<{ category: string; index: number } | null>(null);

  useEffect(() => {
    const loadGallery = async () => {
      setLoading(true);
      setError("");

      if (!isGallerySupabaseConfigured) {
        setItems([]);
        setCategories([]);
        setError("Supabase is not configured for gallery.");
        setLoading(false);
        return;
      }

      try {
        const [galleryItems, savedCategories] = await Promise.all([listGalleryItems(), listGalleryCategories()]);
        setItems(galleryItems);
        setCategories(mergeCategories(savedCategories, galleryItems.map((item) => item.category)));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load gallery images.");
      } finally {
        setLoading(false);
      }
    };

    void loadGallery();
  }, []);

  useEffect(() => {
    const queryCategory = searchParams.get("category")?.trim() || "All";
    if (queryCategory !== selectedCategory) {
      setSelectedCategory(queryCategory);
    }
  }, [searchParams, selectedCategory]);

  useEffect(() => {
    if (selectedCategory === "All") return;
    if (categories.includes(selectedCategory)) return;
    setSelectedCategory("All");
    setSearchParams({});
  }, [categories, selectedCategory, setSearchParams]);

  const categoryItemsMap = useMemo(() => {
    const grouped: Record<string, GalleryItem[]> = {};
    for (const item of items) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }
    return grouped;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "All") return items;
    return items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  const changeCategory = (category: string) => {
    setSelectedCategory(category);
    if (category === "All") {
      setSearchParams({});
      return;
    }
    setSearchParams({ category });
  };

  const openLightbox = (item: GalleryItem) => {
    const categoryItems = categoryItemsMap[item.category] ?? [];
    const index = categoryItems.findIndex((categoryItem) => categoryItem.id === item.id);
    if (index === -1) return;
    setLightboxState({ category: item.category, index });
  };

  const closeLightbox = () => setLightboxState(null);

  const lightboxItems = lightboxState ? categoryItemsMap[lightboxState.category] ?? [] : [];
  const activeLightboxItem = lightboxState ? lightboxItems[lightboxState.index] : null;
  const canGoPrevious = Boolean(lightboxState && lightboxState.index > 0);
  const canGoNext = Boolean(lightboxState && lightboxState.index < lightboxItems.length - 1);

  const goPrevious = () => {
    if (!lightboxState || !canGoPrevious) return;
    setLightboxState((current) => (current ? { ...current, index: Math.max(0, current.index - 1) } : current));
  };

  const goNext = () => {
    if (!lightboxState || !canGoNext) return;
    setLightboxState((current) =>
      current ? { ...current, index: Math.min((categoryItemsMap[current.category]?.length ?? 1) - 1, current.index + 1) } : current,
    );
  };

  useEffect(() => {
    if (!lightboxState) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") goPrevious();
      if (event.key === "ArrowRight") goNext();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxState, canGoNext, canGoPrevious]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-background to-beige/20">
      <Navbar />

      <section className="container mx-auto px-4 pt-28 pb-10 md:pt-32 md:pb-14">
        <div className="mb-8">
          <p className="text-accent text-sm tracking-[0.2em] uppercase font-medium mb-2">Project Gallery</p>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Gallery By Category</h1>
          <p className="mt-3 text-muted-foreground max-w-3xl">
            Browse all project images category-wise. Pick a category to view every uploaded photo in that section.
          </p>
        </div>

        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter size={16} />
              Filter by category
            </div>
            <select
              value={selectedCategory}
              onChange={(event) => changeCategory(event.target.value)}
              className="w-full md:w-80 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="All">All Categories</option>
              {categories.map((category) => (
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
            Loading gallery...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">{error}</div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <h3 className="font-heading text-xl mb-2">No images in this category yet</h3>
            <p className="text-muted-foreground text-sm">
              Ask admin to upload photos for <span className="font-medium">{selectedCategory}</span>.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <article key={item.id} className="rounded-xl border border-border bg-card p-2 flex flex-col">
                <button type="button" onClick={() => openLightbox(item)} className="text-left">
                  <img src={item.imageUrl} alt={item.title} className="w-full aspect-[4/3] rounded-lg object-cover" loading="lazy" />
                </button>
                <div className="p-2">
                  <h3 className="font-semibold text-foreground line-clamp-1">{item.title}</h3>
                  <button
                    type="button"
                    onClick={() => changeCategory(item.category)}
                    className="mt-1 inline-flex text-xs px-2 py-1 rounded-full border border-border hover:border-accent/50 hover:text-accent transition-colors"
                  >
                    {item.category}
                  </button>
                  {item.description ? <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.description}</p> : null}
                  <button
                    type="button"
                    onClick={() => openLightbox(item)}
                    className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <Expand size={14} />
                    Full Screen
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {activeLightboxItem ? (
        <div className="fixed inset-0 z-[70] bg-black/90 p-3 md:p-8">
          <button
            type="button"
            onClick={closeLightbox}
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
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/15 text-white hover:bg-white/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>

          <div className="h-full flex flex-col items-center justify-center gap-4">
            <img
              src={activeLightboxItem.imageUrl}
              alt={activeLightboxItem.title}
              className="max-h-[78vh] max-w-full object-contain rounded-md"
            />
            <div className="text-center text-white px-6">
              <p className="text-lg font-semibold">{activeLightboxItem.title}</p>
              <p className="text-sm text-white/80">
                {activeLightboxItem.category} | {lightboxState!.index + 1} / {lightboxItems.length}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Gallery;
