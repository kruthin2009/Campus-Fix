import { useState, type ReactNode } from "react";
import type { ReportPriority, ReportStatus } from "../../types/models";

export function LoadingScreen({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="full-screen-center">
      <div className="spinner" aria-hidden="true" />
      <p className="loading-label">{label}</p>
    </div>
  );
}

export function Skeleton({ height = 16, width = "100%" }: { height?: number; width?: string | number }) {
  return <div className="skeleton" style={{ height, width }} />;
}

export function SkeletonCard() {
  return (
    <div className="card">
      <Skeleton height={20} width="60%" />
      <div style={{ height: 10 }} />
      <Skeleton height={14} width="90%" />
      <div style={{ height: 6 }} />
      <Skeleton height={14} width="40%" />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">📭</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <div className="error-state__icon">⚠️</div>
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn--secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  submitted: "Submitted",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  closed: "Closed",
  rejected: "Rejected",
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  const safeStatus = status && STATUS_LABELS[status] ? status : "submitted";
  return (
    <span className={`badge badge--status-${safeStatus}`}>
      {STATUS_LABELS[safeStatus]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: ReportPriority }) {
  const safePriority = priority && ["low", "medium", "high", "urgent"].includes(priority)
    ? priority
    : "medium";
  return (
    <span className={`badge badge--priority-${safePriority}`}>
      {safePriority.charAt(0).toUpperCase() + safePriority.slice(1)}
    </span>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal__actions">
          <button className="btn btn--secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={danger ? "btn btn--danger" : "btn btn--primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-rating" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-rating__star ${
            (hover || value) >= star ? "is-filled" : ""
          }`}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="star-rating star-rating--display">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star-rating__star ${rating >= star ? "is-filled" : ""}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
    resolve?: (value: boolean) => void;
  }>({ open: false, title: "", message: "" });

  function confirm(options: {
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
  }): Promise<boolean> {
    return new Promise((resolve) => {
      setState({ ...options, open: true, resolve });
    });
  }

  const dialog = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      danger={state.danger}
      onConfirm={() => {
        state.resolve?.(true);
        setState((s) => ({ ...s, open: false }));
      }}
      onCancel={() => {
        state.resolve?.(false);
        setState((s) => ({ ...s, open: false }));
      }}
    />
  );

  return { confirm, dialog };
}
