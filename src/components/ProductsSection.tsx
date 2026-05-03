import { motion } from "framer-motion";
import plywoodImg from "@/assets/plywood-product.jpg";
import veneerImg from "@/assets/veneer-product.jpg";
import kitchenImg from "@/assets/kitchen-interior.jpg";
import wardrobeImg from "@/assets/wardrobe-interior.jpg";
import tvUnitImg from "@/assets/tv-unit.jpg";

const products = [
  {
    title: "Plywood",
    description: "BWR, BWP, Marine, Commercial & Flexible — ISI certified for every application.",
    image: plywoodImg,
  },
  {
    title: "Decorative Veneers",
    description: "Natural wood species veneers — Teak, Oak, Walnut, Rosewood & more.",
    image: veneerImg,
  },
  {
    title: "Modular Kitchens",
    description: "Bespoke kitchen designs with premium wood finishes and modern hardware.",
    image: kitchenImg,
  },
  {
    title: "Wardrobes & Storage",
    description: "Custom wardrobes and cupboards crafted for style and functionality.",
    image: wardrobeImg,
  },
  {
    title: "TV & Entertainment Units",
    description: "Contemporary entertainment centres with integrated lighting and storage.",
    image: tvUnitImg,
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const ProductsSection = () => {
  return (
    <section id="products" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-accent font-medium tracking-widest uppercase text-sm mb-3">Our Products</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
            Premium Wood Products & Interiors
          </h2>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {products.map((product) => (
            <motion.div
              key={product.title}
              variants={item}
              className="group bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
            >
              <div className="overflow-hidden aspect-[4/3]">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  width={800}
                  height={600}
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-heading font-semibold text-foreground mb-2">{product.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{product.description}</p>
                <a href="#contact" className="text-accent font-semibold text-sm hover:underline uppercase tracking-wide">
                  View Details →
                </a>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ProductsSection;
