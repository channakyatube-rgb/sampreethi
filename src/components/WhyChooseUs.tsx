import { motion } from "framer-motion";

const features = [
  { icon: "🏆", title: "17+ Years Experience", description: "Trusted since 2007" },
  { icon: "✅", title: "ISI Certified Materials", description: "Quality assured products" },
  { icon: "👷", title: "In-house Design Team", description: "Expert designers & craftsmen" },
  { icon: "⏰", title: "On-time Delivery", description: "We respect your timelines" },
  { icon: "🛡️", title: "After-sales Support", description: "Ongoing maintenance help" },
  { icon: "🏠", title: "Free Site Visit", description: "Complimentary consultation" },
];

const testimonials = [
  {
    name: "Rajesh Kumar",
    text: "Sampreethi transformed our entire home. The modular kitchen quality is outstanding and the team was incredibly professional.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    text: "Best plywood and veneer supplier in Hyderabad. Their wood species collection is unmatched. Highly recommend!",
    rating: 5,
  },
  {
    name: "Arjun Reddy",
    text: "From design to installation, everything was seamless. The wardrobe craftsmanship is exceptional.",
    rating: 5,
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-accent font-medium tracking-widest uppercase text-sm mb-3">Why Us</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
            Why Choose Sampreethi
          </h2>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6 mb-20">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="text-center"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className="text-accent">★</span>
                ))}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">"{t.text}"</p>
              <p className="font-semibold text-foreground text-sm">{t.name}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
