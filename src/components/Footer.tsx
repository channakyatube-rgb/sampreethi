import logo from "@/assets/logo.png";
import { Facebook, Instagram, MessageCircle, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const contactNumberDisplay = "+91 92465 76577";
const contactNumberRaw = "919246576577";
const whatsappText = "Hi! I'm interested in your products.";
const storeLatitude = "17.3830205714007";
const storeLongitude = "78.46422093592928";
const storeMapUrl = `https://www.google.com/maps/search/?api=1&query=${storeLatitude},${storeLongitude}`;

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <img src={logo} alt="Sampreethi Plywood" className="h-12 w-auto mb-4 brightness-200" />
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Premium plywood, veneers & complete interior solutions since 2007. Hyderabad's trusted wood specialists.
            </p>
            <div className="mt-4 inline-block bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-semibold">
              Since 2007
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              {[
                { label: "Home", href: "#home" },
                { label: "About", href: "#about" },
                { label: "Products", href: "#products" },
                { label: "Services", href: "#services" },
                { label: "Gallery", href: "/gallery", route: true },
                { label: "Catalogues", href: "/catalogues", route: true },
                { label: "Contact", href: "#contact" },
              ].map((link) => (
                <li key={link.href}>
                  {link.route ? (
                    <Link to={link.href} className="hover:text-accent transition-colors">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="hover:text-accent transition-colors">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Products</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              {["BWR Plywood", "Marine Plywood", "Decorative Veneers", "MDF Boards", "Laminates", "Hardware"].map((p) => (
                <li key={p}>
                  <a href="#products" className="hover:text-accent transition-colors">
                    {p}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Connect</h4>
            <div className="flex gap-3 mb-4">
              {[
                { label: "Instagram", icon: Instagram },
                { label: "Facebook", icon: Facebook },
                { label: "YouTube", icon: Youtube },
                { label: "WhatsApp", icon: MessageCircle },
              ].map((s) => (
                <span
                  key={s.label}
                  className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-accent/30 transition-colors"
                  title={s.label}
                >
                  <s.icon size={18} aria-hidden="true" />
                </span>
              ))}
            </div>
            <p className="text-sm text-primary-foreground/70">
              Sampreethi Plywood & Veneer, Hyderabad, Telangana, India
            </p>
            <a
              href={storeMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-sm text-primary-foreground/70 hover:text-accent transition-colors"
            >
              Open Exact Location
            </a>
            <div className="mt-2 space-y-1 text-sm text-primary-foreground/70">
              <a href={`tel:+${contactNumberRaw}`} className="block hover:text-accent transition-colors">
                Call: {contactNumberDisplay}
              </a>
              <a
                href={`https://wa.me/${contactNumberRaw}?text=${encodeURIComponent(whatsappText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-accent transition-colors"
              >
                WhatsApp: {contactNumberDisplay}
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-6 text-center text-sm text-primary-foreground/50">
          (c) {new Date().getFullYear()} Sampreethi Plywood & Veneer. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
