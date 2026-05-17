import { motion } from "framer-motion";
import heroImg from "@/assets/hero-interior.jpg";

const stats = [
  { value: "17+", label: "Years of Excellence" },
  { value: "5000+", label: "Projects Completed" },
  { value: "200+", label: "Wood Species" },
  { value: "Pan-India", label: "Service Coverage" },
];

const HeroSection = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroImg} alt="Premium interior" className="w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/10" />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-20">
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-accent font-medium tracking-widest uppercase text-sm mb-4"
          >
            Since 2007
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-primary-foreground leading-tight mb-6"
          >
            Crafting Spaces with the Finest{" "}
            <span className="text-gradient-gold">Species of Wood</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-xl font-light"
          >
            Premium Plywood, Veneers & Complete Interior Solutions — transforming homes with nature's finest materials.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap gap-4"
          >
            <a
              href="#products"
              className="bg-accent text-accent-foreground px-8 py-4 rounded-md font-semibold hover:bg-accent/90 transition-all shadow-lg text-sm uppercase tracking-wide"
            >
              Explore Products
            </a>
            <a
              href="#contact"
              className="border-2 border-primary-foreground/30 text-primary-foreground px-8 py-4 rounded-md font-semibold hover:bg-primary-foreground/10 transition-all text-sm uppercase tracking-wide"
            >
              Get a Free Quote
            </a>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-16 bg-primary-foreground/10 backdrop-blur-md rounded-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6 border border-primary-foreground/10"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-heading font-bold text-accent">{stat.value}</div>
              <div className="text-sm text-primary-foreground/70 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
