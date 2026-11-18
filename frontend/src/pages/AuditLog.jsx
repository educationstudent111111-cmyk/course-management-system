import { useEffect, useState } from "react";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const initialFilters = {
  entityType: "",
  entityId: "",
  actor: "",
  action: "",
  from: "",
  to: "",
};

function AuditLog() {
  const [filters, setFilters] = useState(initialFilters);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadAuditLogs = async () => {
      try {
        const response = await api.get("/audit-logs", {
          params: { ...filters, page, limit: 20 },
        });

        if (cancelled) return;

        setLogs(response.data.logs || []);
        setPagination(response.data.pagination || {
          page,
          limit: 20,
          total: 0,
          totalPages: 0,
        });
        setError("");
      } catch (requestError) {
        if (cancelled) return;

        setError(
          requestError.response?.data?.message ||
            "Could not load audit logs."
        );
        setLogs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAuditLogs();

    return () => {
      cancelled = true;
    };
  }, [filters, page]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setPage(1);
    setLoading(true);
    setError("");
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
  };

  const formatSnapshot = (value) => {
    if (value === null || value === undefined) return "No data";

    try {
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(value);
    }
  };

  const totalPages = pagination.totalPages;
  const start = logs.length === 0 ? 0 : (page - 1) * 20 + 1;
  const end = logs.length === 0 ? 0 : start + logs.length - 1;

  return (
    <>
      <Navbar />

      <main className="container">
        <div className="page-header">
          <div>
            <h1>Audit Logs</h1>
            <p className="page-subtitle">
              Administrative changes, newest first.
            </p>
          </div>
        </div>

        <div className="filter-bar audit-filters">
          <div className="form-group">
            <label htmlFor="audit-entity-type">Entity</label>
            <select
              id="audit-entity-type"
              className="input"
              value={filters.entityType}
              onChange={(event) => updateFilter("entityType", event.target.value)}
            >
              <option value="">All entities</option>
              <option value="course">Course</option>
              <option value="enrollment">Enrollment</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="audit-entity-id">Entity ID</label>
            <input
              id="audit-entity-id"
              className="input"
              type="number"
              min="1"
              value={filters.entityId}
              onChange={(event) => updateFilter("entityId", event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="audit-actor">Actor username or ID</label>
            <input
              id="audit-actor"
              className="input"
              type="search"
              value={filters.actor}
              onChange={(event) => updateFilter("actor", event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="audit-action">Action</label>
            <input
              id="audit-action"
              className="input"
              type="search"
              placeholder="e.g. course.updated"
              value={filters.action}
              onChange={(event) => updateFilter("action", event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="audit-from">From date</label>
            <input
              id="audit-from"
              className="input"
              type="date"
              max={filters.to || undefined}
              value={filters.from}
              onChange={(event) => updateFilter("from", event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="audit-to">To date</label>
            <input
              id="audit-to"
              className="input"
              type="date"
              min={filters.from || undefined}
              value={filters.to}
              onChange={(event) => updateFilter("to", event.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setFilters(initialFilters);
              setPage(1);
              setLoading(true);
              setError("");
            }}
          >
            Clear filters
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        <section className="section-card">
          <div className="section-card-header">
            <h2>Administrative activity</h2>
            {!loading && <p>Showing {start}–{end} of {pagination.total}</p>}
          </div>

          {loading && <p className="loading">Loading audit logs...</p>}
          {!loading && !error && logs.length === 0 && (
            <p className="empty">No audit records match these filters.</p>
          )}

          {!loading && logs.length > 0 && (
            <div className="table-wrapper">
              <table className="table audit-log-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Before</th>
                    <th>After</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDate(log.created_at)}</td>
                      <td>
                        <strong>{log.actor_username}</strong>
                        <small className="audit-secondary">
                          {log.actor_role} · ID {log.actor_id ?? "deleted"}
                        </small>
                      </td>
                      <td>{log.action}</td>
                      <td>
                        {log.entity_type} #{log.entity_id ?? "-"}
                      </td>
                      <td>
                        <details className="audit-snapshot">
                          <summary>View data</summary>
                          <pre>{formatSnapshot(log.previous_data)}</pre>
                        </details>
                      </td>
                      <td>
                        <details className="audit-snapshot">
                          <summary>View data</summary>
                          <pre>{formatSnapshot(log.new_data)}</pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && (
            <div className="pagination-controls">
              <button
                type="button"
                className="btn"
                disabled={page <= 1 || totalPages === 0}
                onClick={() => {
                  setPage(1);
                  setLoading(true);
                }}
              >First</button>
              <button
                type="button"
                className="btn"
                disabled={page <= 1 || totalPages === 0}
                onClick={() => {
                  setPage((current) => Math.max(1, current - 1));
                  setLoading(true);
                }}
              >Previous</button>
              <span>Page {totalPages === 0 ? 0 : page} of {totalPages}</span>
              <button
                type="button"
                className="btn"
                disabled={page >= totalPages || totalPages === 0}
                onClick={() => {
                  setPage((current) => Math.min(totalPages, current + 1));
                  setLoading(true);
                }}
              >Next</button>
              <button
                type="button"
                className="btn"
                disabled={page >= totalPages || totalPages === 0}
                onClick={() => {
                  setPage(totalPages);
                  setLoading(true);
                }}
              >Last</button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}

export default AuditLog;