type ApiRequest = { method?: string };
type ApiResponse = { status: (code: number) => ApiResponse; json: (value: unknown) => void; setHeader: (name: string, value: string) => void };

type NewsItem = { title: string; link: string; source: string; publishedAt: string; summary: string };

function decode(value: string): string {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function tag(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match ? decode(match[1]) : "";
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const response = await fetch("https://news.google.com/rss/search?q=artificial+intelligence+OR+generative+AI&hl=en-IN&gl=IN&ceid=IN:en", { signal: AbortSignal.timeout(9000), headers: { "User-Agent": "CampusFixNewsFeed/1.0" } });
    if (!response.ok) return res.status(502).json({ error: "The external news provider is unavailable." });
    const xml = await response.text();
    const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
    const items: NewsItem[] = blocks.slice(0, 12).map((block) => {
      const sourceMatch = block.match(/<source(?:\s[^>]*)?>([\s\S]*?)<\/source>/i);
      return { title: tag(block, "title"), link: tag(block, "link"), source: sourceMatch ? decode(sourceMatch[1]) : "Google News publisher", publishedAt: tag(block, "pubDate"), summary: tag(block, "description").slice(0, 260) };
    }).filter((item) => item.title && /^https:\/\//i.test(item.link));
    return res.status(200).json({ items, updatedAt: new Date().toISOString() });
  } catch {
    return res.status(502).json({ error: "Could not reach the external news feed. Please try again later." });
  }
}
