import { useState } from "react";
import { motion } from "framer-motion";

const storeLatitude = "17.3830205714007";
const storeLongitude = "78.46422093592928";
const storeCoordinates = `${storeLatitude},${storeLongitude}`;
const storeMapUrl = `https://www.google.com/maps/search/?api=1&query=${storeCoordinates}`;
const storeMapEmbedUrl = `https://www.google.com/maps?q=${storeCoordinates}&z=17&output=embed`;
const contactNumberDisplay = "+91 92465 76577";
const contactNumberRaw = "919246576577";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    service: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const whatsappMsg = encodeURIComponent(
      `Hi! I'm ${formData.name} from ${formData.city}. I'm interested in ${formData.service}. ${formData.message}`
    );
    window.open(`https://wa.me/${contactNumberRaw}?text=${whatsappMsg}`, "_blank");
  };

  return (
    <section id="contact" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-accent font-medium tracking-widest uppercase text-sm mb-3">Get in Touch</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
            Let's Build Your Dream Space
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-5"
          >
            <div className="grid md:grid-cols-2 gap-5">
              <input
                type="text"
                placeholder="Your Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-accent outline-none"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="px-4 py-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-accent outline-none"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="px-4 py-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-accent outline-none"
              />
              <input
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="px-4 py-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-accent outline-none"
              />
            </div>
            <select
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-accent outline-none"
            >
              <option value="">Select Service Required</option>
              <option value="Plywood Supply">Plywood Supply</option>
              <option value="Veneer Supply">Veneer Supply</option>
              <option value="Modular Kitchen">Modular Kitchen</option>
              <option value="Wardrobe">Wardrobe & Cupboard</option>
              <option value="Full Home Interior">Full Home Interior</option>
              <option value="Renovation">Home Renovation</option>
              <option value="Commercial Project">Commercial Project</option>
              <option value="Other">Other</option>
            </select>
            <textarea
              placeholder="Describe your project requirements..."
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-accent outline-none resize-none"
            />
            <button
              type="submit"
              className="w-full bg-accent text-accent-foreground py-4 rounded-md font-semibold hover:bg-accent/90 transition-colors shadow-md uppercase tracking-wide text-sm"
            >
              Book a Free Site Visit
            </button>
          </motion.form>

          {/* Info + Map */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div>
                <h3 className="font-heading font-semibold text-foreground mb-1">Address</h3>
                <p className="text-muted-foreground text-sm">Sampreethi Plywood & Veneer, Hyderabad, Telangana, India</p>
                <a
                  href={storeMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  Open Exact Location
                </a>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground mb-1">Phone</h3>
                <p className="text-muted-foreground text-sm">{contactNumberDisplay}</p>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground mb-1">Working Hours</h3>
                <p className="text-muted-foreground text-sm">
                  Mon - Sat: 9:00 AM - 7:00 PM
                  <br />
                  Sunday: By Appointment
                </p>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-border shadow-md aspect-video">
              <iframe
                src={storeMapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Sampreethi Plywood Location"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
