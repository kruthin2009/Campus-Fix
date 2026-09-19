import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { subscribeToActiveTowers } from "../../services/towerService";
import { EmptyState, ErrorState, SkeletonCard } from "../../components/common/Common";
import type { Tower } from "../../types/models";

export function TowerSelectPage() {
  const navigate = useNavigate();
  const [towers, setTowers] = useState<Tower[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToActiveTowers(
      setTowers,
      (err) =>
        setError(err instanceof Error ? err.message : "Unable to load towers.")
    );
    return unsubscribe;
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Select Your Tower</h1>
        <p>Choose the tower where you'd like to raise a complaint.</p>
      </div>

      {error && <ErrorState message={error} />}

      {towers === null && !error ? (
        <div className="card-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : towers && towers.length === 0 ? (
        <EmptyState
          title="No towers available"
          description="Please contact the administrator — no towers have been set up yet."
        />
      ) : (
        <div className="tower-select-grid">
          {towers?.map((tower) => (
            <button
              key={tower.id}
              className="tower-select-card"
              onClick={() => navigate(`/student/raise/${tower.id}`)}
            >
              <div className="tower-select-card__image">
                {tower.imageUrl ? (
                  <img src={tower.imageUrl} alt={tower.name} />
                ) : (
                  <div className="tower-placeholder">🏢</div>
                )}
              </div>
              <div className="tower-select-card__name">{tower.name}</div>
              {tower.description && (
                <div className="tower-select-card__desc">{tower.description}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
