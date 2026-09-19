import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listActiveTowers } from "../../services/towerService";
import { listActiveDepartments } from "../../services/departmentService";
import { submitReport } from "../../services/reportService";
import { isMediaUploadEnabled } from "../../services/mediaService";
import { ErrorState, LoadingScreen } from "../../components/common/Common";
import type { Department, ReportPriority, StudentProfile, Tower } from "../../types/models";

const PRIORITIES: ReportPriority[] = ["low", "medium", "high", "urgent"];

export function RaiseComplaintPage() {
  const { towerId } = useParams<{ towerId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [tower, setTower] = useState<Tower | null | undefined>(undefined);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const student = profile as StudentProfile | null;
  const [roomNumber, setRoomNumber] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<ReportPriority>("medium");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!towerId) return;
    Promise.all([listActiveTowers(), listActiveDepartments()])
      .then(([towers, depts]) => {
        setTower(towers.find((t) => t.id === towerId) ?? null);
        setDepartments(depts);
        if (depts.length > 0) setDepartmentId(depts[0].id);
      })
      .catch((err) =>
        setLoadError(
          err instanceof Error ? err.message : "Unable to load form data."
        )
      );
  }, [towerId]);

  useEffect(() => {
    if (student?.roomNumber) setRoomNumber(student.roomNumber);
  }, [student]);

  if (loadError) return <ErrorState message={loadError} />;
  if (tower === undefined) return <LoadingScreen label="Loading..." />;
  if (tower === null) {
    return (
      <ErrorState message="This tower could not be found. It may have been removed." />
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!roomNumber.trim() || !description.trim() || !title.trim() || !departmentId) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!student || !tower) return;

    const department = departments.find((d) => d.id === departmentId);
    if (!department) {
      setError("Please select a valid issue category.");
      return;
    }

    setSubmitting(true);
    try {
      const reportId = await submitReport({
        studentId: student.uid,
        studentName: student.name,
        studentRoomNumber: student.roomNumber,
        towerId: tower.id,
        towerName: tower.name,
        roomNumber,
        departmentId: department.id,
        departmentName: department.name,
        title,
        description,
        priority,
        photoFile,
      });
      navigate(`/student/confirmation/${reportId}`, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Your complaint could not be submitted. Please try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Raise a Complaint</h1>
        <p>
          Tower: <strong>{tower.name}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card stacked-form" style={{ maxWidth: 560 }}>
        <label className="field">
          <span>Room Number *</span>
          <input
            required
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Issue Category *</span>
          <select
            required
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Issue Title *</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Leaking tap in bathroom"
          />
        </label>

        <label className="field">
          <span>Issue Description *</span>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail..."
          />
        </label>

        <label className="field">
          <span>Priority</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as ReportPriority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="field photo-field">
          <span>Photo <em>(Optional)</em></span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          />
          <small className="field-help">You can submit without a photo. Adding one is completely optional.</small>
          {!isMediaUploadEnabled() && (
            <small className="field-help">Photo storage is not enabled right now, so a selected image will not be required for submission.</small>
          )}
        </label>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Complaint"}
        </button>
      </form>
    </div>
  );
}
