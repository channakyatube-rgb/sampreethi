import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const NAV_OFFSET = 96;

const ScrollToHash = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    const hash = decodeURIComponent(location.hash.replace("#", "").trim());
    if (!hash) return;

    const scrollToTarget = () => {
      const element = document.getElementById(hash);
      if (!element) return;

      const top = element.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
      window.scrollTo({
        top: Math.max(top, 0),
        behavior: "smooth",
      });
    };

    const frameId = window.requestAnimationFrame(scrollToTarget);
    const timeoutId = window.setTimeout(scrollToTarget, 120);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [location.pathname, location.hash]);

  return null;
};

export default ScrollToHash;
