import { motion } from "framer-motion";

const services = [
  { icon: "🍳", title: "Modular Kitchen Design", description: "Custom kitchen layouts with premium cabinetry and fittings." },
  { icon: "🚪", title: "Wardrobe & Cupboards", description: "Walk-in and sliding wardrobes tailored to your space." },
  { icon: "🏠", title: "Full Home Interiors", description: "End-to-end interior design and execution for your dream home." },
  { icon: "🔨", title: "Home Renovation", description: "Transform existing spaces with modern woodwork and finishes." },
  { icon: "🕌", title: "Pooja Room Design", description: "Elegant traditional and contemporary mandir designs." },
  { icon: "📺", title: "TV & Bar Units", description: "Entertainment centres and bar counters with style." },
  { icon: "🏢", title: "Commercial Interiors", description: "Office cabins, reception desks and corporate woodwork." },
  { icon: "🎨", title: "Wall Paneling & Ceilings", description: "Decorative wall panels and false ceiling installations." },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-accent font-medium tracking-widest uppercase text-sm mb-3">Our Services</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
            Complete Interior Solutions
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="bg-background rounded-xl p-6 hover:shadow-lg transition-shadow border border-border group"
            >
              <div className="text-3xl mb-4">{service.icon}</div>
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2">{service.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
