import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Announces route changes to screen readers via an aria-live region.
 * Renders a visually-hidden element that updates on navigation.
 */
export function RouteAnnouncer() {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    // Build a human-readable page name from the pathname
    const path = location.pathname;
    const name =
      path === "/"
        ? "Home"
        : path
            .replace(/^\//, "")
            .replace(/\//g, " - ")
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

    setAnnouncement(`Navigated to ${name}`);
  }, [location.pathname]);

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
