/** Turn a YouTube URL (watch / youtu.be / shorts / embed) into a privacy-friendly
 *  embed URL. Returns null if it isn't a recognised YouTube link. */
export function youtubeEmbed(url: string): string | null {
  const patterns = [
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}`;
  }
  return null;
}
