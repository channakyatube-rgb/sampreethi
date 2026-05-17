import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import kitchenImg from "@/assets/kitchen-interior.jpg";
import wardrobeImg from "@/assets/wardrobe-interior.jpg";
import tvUnitImg from "@/assets/tv-unit.jpg";
import poojaImg from "@/assets/pooja-unit.jpg";
import heroImg from "@/assets/hero-interior.jpg";
import { GalleryItem, isGallerySupabaseConfigured, listGalleryItems } from "@/lib/gallery";

interface GalleryDisplayItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  description: string;
}

const fallbackProjects: GalleryDisplayItem[] = [
  { id: "fallback-1", title: "Modern Walnut Kitchen", category: "Kitchens", imageUrl: kitchenImg, description: "" },
  { id: "fallback-2", title: "Premium Walk-in Wardrobe", category: "Wardrobes", imageUrl: wardrobeImg, description: "" },
  { id: "fallback-3", title: "Contemporary TV Unit", category: "Living Rooms", imageUrl: tvUnitImg, description: "" },
  { id: "fallback-4", title: "Traditional Teak Mandir", category: "Pooja Rooms", imageUrl: poojaImg, description: "" },
  { id: "fallback-5", title: "Luxury Living Room", category: "Living Rooms", imageUrl: heroImg, description: "" },
  { id: "fallback-6", title: "Sliding Door Wardrobe", category: "Wardrobes", imageUrl: wardrobeImg, description: "" },
];

const GallerySection = () => {
  const [active, setActive] = useState("All");
  const [items, setItems] = useState<GalleryDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadGallery = async () => {
      setLoading(true);
      setError("");

      if (!isGallerySupabaseConfigured) {
        setItems(fallbackProjects);
        setLoading(false);
        return;
      }

      try {
        const data = await listGalleryItems();
        const mapped = data.map((item: GalleryItem) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          imageUrl: item.imageUrl,
          description: item.description,
        }));
        setItems(mapped);
      } catch (loadError) {
        setItems(fallbackProjects);
        setError(loadError instanceof Error ? loadError.message : "Could not load gallery images.");
      } finally {
        setLoading(false);
      }
    };

    void loadGallery();
  }, []);

  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category).filter(Boolean))), [items]);

  const filters = useMemo(() => ["All", ...categories], [categories]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  useEffect(() => {
    if (active === "All") return;
    if (filters.includes(active)) return;
    setActive("All");
  }, [active, filters]);

  const visibleItems = useMemo(() => {
    if (active !== "All") {
      return items.filter((item) => item.category === active);
    }

    const firstByCategory = new Map<string, GalleryDisplayItem>();
    for (const item of items) {
      if (!firstByCategory.has(item.category)) {
        firstByCategory.set(item.category, item);
      }
    }

    return Array.from(firstByCategory.values());
  }, [active, items]);

  return (
    <section id="gallery" className="py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-accent font-medium tracking-widest uppercase text-sm mb-3">Portfolio</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Our Completed Projects</h2>
          <p className="mt-3 text-muted-foreground">
            {active === "All"
              ? "One highlight image per category. Select a category to see all images in that category."
              : `Showing all images in ${active}.`}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActive(filter)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                active === filter
                  ? "bg-accent text-accent-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {active !== "All" ? (
          <div className="flex justify-center mb-8">
            <button
              type="button"
              onClick={() => setActive("All")}
              className="px-4 py-2 rounded-md border border-border bg-background text-sm font-medium hover:border-accent/50 hover:text-accent transition-colors"
            >
              Back To Category Covers
            </button>
          </div>
        ) : null}

        {error ? <p className="text-center text-sm text-destructive mb-6">{error}</p> : null}

        {loading ? (
          <div className="text-center text-muted-foreground">Loading gallery...</div>
        ) : visibleItems.length === 0 ? (
          <div className="text-center text-muted-foreground">No gallery images uploaded yet.</div>
        ) : (
          <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleItems.map((project, index) => (
              <motion.div
                key={`${project.id}-${index}`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="group relative overflow-hidden rounded-xl aspect-[4/3]"
              >
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-4 flex flex-col justify-end">
                  <h3 className="text-white font-heading font-semibold text-lg">{project.title}</h3>
                  <p className="text-white/80 text-sm">
                    {project.category}
                    {active === "All" ? ` | ${categoryCounts[project.category] ?? 1} images` : ""}
                  </p>
                  <div className="mt-3 flex gap-2">
                    {active === "All" ? (
                      <button
                        type="button"
                        onClick={() => setActive(project.category)}
                        className="px-3 py-1.5 rounded-md bg-background/95 text-foreground text-xs font-semibold hover:bg-background transition-colors"
                      >
                        Show Here
                      </button>
                    ) : null}
                    <Link
                      to={`/gallery?category=${encodeURIComponent(project.category)}`}
                      className="px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors"
                    >
                      Explore
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="text-center mt-12">
          <Link
            to="/gallery"
            className="bg-accent text-accent-foreground px-8 py-3 rounded-md font-semibold hover:bg-accent/90 transition-colors shadow-md text-sm uppercase tracking-wide"
          >
            Open Full Gallery Page
          </Link>
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
