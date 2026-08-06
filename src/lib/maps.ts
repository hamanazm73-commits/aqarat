/**
 * Pull coordinates out of whatever Google Maps just put on the clipboard.
 *
 * Nobody types latitude and longitude. On a phone the way to get a place is
 * to press it in Google Maps and hit share, and what comes back is a URL —
 * so that URL is what the form should accept.
 *
 * Google has several shapes for it, and they all appear in the wild:
 *
 *   /maps/@36.19,44.00,15z                     the map centre
 *   /maps/place/Name/@36.19,44.00,17z/...      a named place
 *   ?q=36.19,44.00  ·  ?ll=36.19,44.00         older share links
 *   !3d36.19!4d44.00                           the pin inside a place URL
 *
 * The last one is checked first: in a place URL both `@` and `!3d` are
 * present, and `@` is wherever the camera happened to be while `!3d` is the
 * pin itself — which is the one someone meant to send.
 *
 * Returns null for a short goo.gl/maps link. Those carry no coordinates at
 * all; only Google can say what they point at, and that needs a request we
 * cannot make from the browser.
 */
export function coordsFromMapsUrl(input: string): { lat: number; lng: number } | null {
  const s = input.trim();
  if (!s) return null;

  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|ll|daddr|center)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    // A bare "36.19, 44.00" pasted on its own.
    /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/,
  ];

  for (const re of patterns) {
    const m = s.match(re);
    if (!m) continue;

    const lat = Number(m[1]);
    const lng = Number(m[2]);
    // A swapped pair or a typo lands outside the globe; better to reject it
    // than to drop a pin in the sea.
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }

  return null;
}
