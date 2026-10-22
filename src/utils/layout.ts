/**
 * Tablet layout helpers.
 * Phones (shortest side < 600) keep full-width layout unchanged.
 * Tablets get a centered content column so UI does not stretch edge-to-edge.
 */
export const TABLET_SHORTEST_MIN = 600;
export const TABLET_CONTENT_MAX = 720;

export function isTabletSize(width: number, height: number) {
  return Math.min(width, height) >= TABLET_SHORTEST_MIN;
}

/** Width available for screen content (equals window width on phones). */
export function contentWidth(width: number, height: number) {
  return isTabletSize(width, height) ? Math.min(width, TABLET_CONTENT_MAX) : width;
}
