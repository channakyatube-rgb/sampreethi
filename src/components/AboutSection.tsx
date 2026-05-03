import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import workshopImg from "@/assets/workshop.jpg";

const milestones = [
  { year: "2007", text: "Founded in Hyderabad with a vision for quality wood products" },
  { year: "2012", text: "Expanded to full interior design and fabrication services" },
  { year: "2018", text: "Reached 3000+ completed projects milestone" },
  { year: "2024", text: "200+ wood species, pan-India operations" },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-accent font-medium tracking-widest uppercase text-sm mb-3">Our Story</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-6">
              A Legacy of Craftsmanship Since 2007
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Sampreethi Plywood & Veneer was born from a passion for wood and a commitment to quality.
              For over 17 years, we have been Hyderabad's trusted name in premium plywood, decorative veneers,
              and end-to-end interior solutions from modular kitchens to complete home renovations.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Our mission is simple: bring the beauty and durability of the world's finest wood species
              into every home and workspace. With ISI-certified materials, an in-house design team,
              and a dedication to on-time delivery, we turn your vision into reality.
            </p>
            <Link
              to="/about"
              className="inline-flex items-center px-6 py-2.5 rounded-md bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors mb-8"
            >
              Know More About Us
            </Link>

            <div className="space-y-4">
              {milestones.map((milestone) => (
                <div key={milestone.year} className="flex gap-4 items-start">
                  <div className="bg-accent text-accent-foreground text-sm font-bold px-3 py-1 rounded-md min-w-[60px] text-center">
                    {milestone.year}
                  </div>
                  <p className="text-sm text-muted-foreground">{milestone.text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <img
              src={workshopImg}
              alt="Our workshop"
              className="rounded-xl shadow-2xl w-full object-cover aspect-[4/3]"
              loading="lazy"
              width={800}
              height={600}
            />
            <div className="absolute -bottom-6 -left-6 bg-accent text-accent-foreground px-8 py-4 rounded-xl shadow-lg">
              <div className="text-3xl font-heading font-bold">17+</div>
              <div className="text-sm">Years of Trust</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
