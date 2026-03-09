import { Link } from "react-router-dom";

function BrandMonitorCard({ brand }) {
  const statusClass =
    brand?.lastStatus && ["live", "blocked", "dead", "timeout", "error", "unknown"].includes(brand.lastStatus)
      ? brand.lastStatus
      : "unknown";

  const imageUrl = brand?.lastScreenshot
    ? `${import.meta.env.VITE_API_URL?.replace("/api", "")}${brand.lastScreenshot}`
    : "";

  return (
    <div className="monitor-card">
      <div className="monitor-preview real-preview">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${brand.name} latest screenshot`}
            className="monitor-image"
          />
        ) : (
          <div className="monitor-placeholder">
            <span>No Screenshot Yet</span>
          </div>
        )}
      </div>

      <div className="monitor-body">
        <div className="monitor-head">
          <h3>{brand?.name}</h3>
          <span className={`status-pill ${statusClass}`}>{statusClass}</span>
        </div>

        <p className="monitor-domain">{brand?.activeDomain?.domain || "No active domain assigned"}</p>

        <div className="monitor-meta">
          <div>
            <small>Brand Code</small>
            <strong>{brand?.code || "-"}</strong>
          </div>

          <div>
            <small>Monitoring</small>
            <strong>{brand?.monitoringEnabled ? "Enabled" : "Disabled"}</strong>
          </div>
        </div>

        <div className="monitor-footer">
          <Link className="btn btn-secondary btn-sm" to={`/brands/${brand._id}`}>
            Open Brand
          </Link>
        </div>
      </div>
    </div>
  );
}

export default BrandMonitorCard;