import { useEffect, useState } from "react";
import { subscribeToReportUpdates } from "../../services/reportService";
import type { ReportUpdate } from "../../types/models";
import { Skeleton } from "./Common";

function formatDateTime(date: Date): string {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReportTimeline({ reportId }: { reportId: string }) {
  const [updates, setUpdates] = useState<ReportUpdate[] | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToReportUpdates(
      reportId,
      setUpdates,
      () => setUpdates([])
    );
    return unsubscribe;
  }, [reportId]);

  if (updates === null) {
    return (
      <div>
        <Skeleton height={40} />
        <div style={{ height: 8 }} />
        <Skeleton height={40} />
      </div>
    );
  }

  if (updates.length === 0) {
    return <p className="muted">No updates yet.</p>;
  }

  return (
    <ol className="timeline">
      {updates.map((update) => (
        <li key={update.id} className="timeline__item">
          <div className="timeline__dot" />
          <div className="timeline__content">
            <div className="timeline__message">{update.message}</div>
            <div className="timeline__meta">
              {update.authorName} ({update.authorRole}) &middot;{" "}
              {update.createdAt?.toDate
                ? formatDateTime(update.createdAt.toDate())
                : "just now"}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
