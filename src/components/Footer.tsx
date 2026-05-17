import logo from "@/assets/logo.svg";
import { Facebook, Instagram, Youtube } from "lucide-react";

const WhatsAppIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);
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
            <img src={logo} alt="Sampreethi Plywood" className="h-12 w-auto mb-4" />
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
              ].map((s) => (
                <span
                  key={s.label}
                  className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-accent/30 transition-colors"
                  title={s.label}
                >
                  <s.icon size={18} aria-hidden="true" />
                </span>
              ))}
              {/* WhatsApp with proper icon */}
              <a
                href={`https://wa.me/${contactNumberRaw}?text=${encodeURIComponent(whatsappText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-90"
                style={{ backgroundColor: "#25D366", color: "#fff" }}
                title="WhatsApp"
              >
                <WhatsAppIconSmall />
              </a>
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
