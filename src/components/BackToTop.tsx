import { useState, useEffect } from "react";

const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 left-6 z-50 bg-accent text-accent-foreground w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform text-lg"
      aria-label="Back to top"
    >
      ↑
    </button>
  );
};

export default BackToTop;
