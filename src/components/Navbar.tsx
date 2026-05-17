import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.svg";

const navLinks = [
  { label: "Home", href: "#home", section: true },
  { label: "About Us", href: "/about", section: false },
  { label: "Products", href: "#products", section: true },
  { label: "Services", href: "#services", section: true },
  { label: "Catalogues", href: "/catalogues", section: false },
  { label: "Calculator", href: "#calculator", section: true },
  { label: "Gallery", href: "/gallery", section: false },
  { label: "Contact", href: "#contact", section: true },
];

const Navbar = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getLinkTarget = (href: string, isSection: boolean) => {
    if (!isSection) return href;
    return { pathname: "/", hash: href };
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-background border-b border-border/50 ${
        scrolled ? "shadow-md" : "shadow-sm"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Sampreethi Plywood & Veneer" className="h-14 w-auto" />
        </Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={getLinkTarget(link.href, link.section)}
              className="text-sm font-medium text-foreground/80 hover:text-accent transition-colors tracking-wide uppercase"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to={getLinkTarget("#contact", true)}
            className="bg-accent text-accent-foreground px-6 py-2.5 rounded-md text-sm font-semibold hover:bg-accent/90 transition-colors shadow-md"
          >
            Get Free Quote
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-foreground transition-transform ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-6 h-0.5 bg-foreground transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-foreground transition-transform ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-t border-border/50 shadow-md"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={getLinkTarget(link.href, link.section)}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium py-2 text-foreground/80 hover:text-accent uppercase tracking-wide"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to={getLinkTarget("#contact", true)}
                onClick={() => setMobileOpen(false)}
                className="bg-accent text-accent-foreground px-6 py-2.5 rounded-md text-sm font-semibold text-center mt-2"
              >
                Get Free Quote
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
