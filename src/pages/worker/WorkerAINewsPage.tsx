import { useEffect, useState } from "react";

type NewsItem = { title: string; link: string; source: string; publishedAt: string; summary: string };
type NewsResponse = { items?: NewsItem[]; updatedAt?: string; error?: string };

export function WorkerAINewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/ai-news", { signal: controller.signal })
      .then(async (response) => {
        const raw = await response.text();
        let data: NewsResponse | null = null;
        if (raw.trim()) {
          try { data = JSON.parse(raw) as NewsResponse; }
          catch {
            throw new Error("The AI news endpoint returned an invalid response. Confirm that the Vercel /api/ai-news function is deployed.");
          }
        }
        if (!response.ok) throw new Error(data?.error || `AI news is temporarily unavailable (HTTP ${response.status}).`);
        if (!data || !Array.isArray(data.items)) throw new Error("The AI news service returned an empty or incomplete response.");
        return data;
      })
      .then((data) => { setItems(data.items ?? []); setUpdatedAt(data.updatedAt ?? ""); })
      .catch((err) => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unable to load AI news."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  return <div>
    <div className="page-header"><h1>Latest AI News</h1><p>Recent artificial-intelligence headlines from external publishers. Open the original article for full context.</p></div>
    {updatedAt && <p className="muted">Feed refreshed: {new Date(updatedAt).toLocaleString()}</p>}
    {loading && <section className="card"><p>Loading latest headlines…</p></section>}
    {error && <section className="card"><h2>News feed unavailable</h2><p className="muted">{error}</p><p className="muted">Try again later. CampusFix work and complaint features remain available.</p></section>}
    {!loading && !error && items.length === 0 && <section className="card"><p>No headlines were returned by the news provider.</p></section>}
    <div className="card-grid">{items.map((item, index) => <article className="card" key={`${item.link}-${index}`}><div className="muted" style={{fontSize:"0.82rem"}}>{item.source} · {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "Recent"}</div><h2>{item.title}</h2>{item.summary && <p>{item.summary}</p>}<a href={item.link} target="_blank" rel="noopener noreferrer">Read original article ↗</a></article>)}</div>
    <p className="muted" style={{marginTop:20,fontSize:"0.82rem"}}>News headlines are supplied by Google News RSS and belong to their original publishers. CampusFix does not independently verify every report.</p>
  </div>;
}
