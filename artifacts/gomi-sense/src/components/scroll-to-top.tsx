import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * ScrollToTop component ensures that the page is scrolled to the top
 * whenever the location changes. This is standard UX for SPAs.
 */
export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}
