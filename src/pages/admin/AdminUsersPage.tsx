import { useEffect, useState } from "react";
import { listAllUsers, setUserActive } from "../../services/userService";
import { EmptyState, ErrorState, SkeletonCard } from "../../components/common/Common";
import { useToast } from "../../context/ToastContext";
import type { UserProfile, UserRole } from "../../types/models";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  operations: "Worker",
  student: "Student",
};

export function AdminUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listAllUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleToggleActive(user: UserProfile) {
    try {
      await setUserActive(user.uid, !user.isActive);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to update user.", "error");
    }
  }

  const filtered = roleFilter ? users.filter((u) => u.role === roleFilter) : users;

  return (
    <div>
      <div className="page-header page-header--row">
        <div>
          <h1>Users</h1>
          <p>Everyone with access to CampusFix.</p>
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as UserRole | "")}>
          <option value="">All Roles</option>
          <option value="admin">Admins</option>
          <option value="operations">Workers</option>
          <option value="student">Students</option>
        </select>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {loading ? (
        <div className="card-grid">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="simple-table-wrapper">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.uid}>
                  <td>{u.name}</td>
                  <td className="muted">{u.email}</td>
                  <td>{ROLE_LABELS[u.role]}</td>
                  <td>
                    <span className={`badge ${u.isActive ? "badge--active" : "badge--inactive"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="simple-table__actions">
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={() => handleToggleActive(u)}
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
