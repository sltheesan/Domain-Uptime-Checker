import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { brandService } from "../features/brands/brandService";
import { domainService } from "../features/domains/domainService";
import { monitoringService } from "../features/monitoring/monitoringService";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";

function BrandDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();

  const canManage = useMemo(
    () => ["admin", "manager"].includes(user?.role),
    [user]
  );

  const [brand, setBrand] = useState(null);
  const [availableDomains, setAvailableDomains] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [selectedDomainId, setSelectedDomainId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const imageBase = import.meta.env.VITE_API_URL?.replace("/api", "");

  const loadPage = async () => {
    try {
      setLoading(true);
      setPageError("");

      const [brandRes, domainsRes] = await Promise.all([
        brandService.getBrandById(id),
        domainService.getAvailableDomains()
      ]);

      setBrand(brandRes.brand);
      setAvailableDomains(domainsRes.domains || []);
    } catch (error) {
      setPageError(error?.response?.data?.message || "Failed to load brand details.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const historyRes = await monitoringService.getHistory(id);
      setHistory(historyRes.logs || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
    loadHistory();
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit("join-brand-room", id);

    const onBrandUpdated = (payload) => {
      if (payload?.brand) {
        setBrand(payload.brand);
      }

      if (payload?.latestLog) {
        setHistory((prev) => [payload.latestLog, ...prev].slice(0, 50));
      }
    };

    socket.on("brand:updated", onBrandUpdated);

    return () => {
      socket.emit("leave-brand-room", id);
      socket.off("brand:updated", onBrandUpdated);
    };
  }, [socket, id]);

  const handleAssign = async () => {
    if (!selectedDomainId) {
      alert("Select a domain first.");
      return;
    }

    try {
      setActionLoading(true);
      await domainService.assignDomainToBrand(selectedDomainId, id);
      setSelectedDomainId("");
      await loadPage();
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to assign domain.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (!brand?.activeDomain?._id) return;

    const ok = window.confirm(
      `Unassign ${brand.activeDomain.domain} from ${brand.name}?`
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      await domainService.unassignDomainFromBrand(brand.activeDomain._id);
      await loadPage();
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to unassign domain.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplace = async () => {
    if (!brand?.activeDomain?._id) {
      alert("No current active domain to replace.");
      return;
    }

    if (!selectedDomainId) {
      alert("Select a replacement domain first.");
      return;
    }

    try {
      setActionLoading(true);
      await domainService.replaceDomain(brand.activeDomain._id, selectedDomainId);
      setSelectedDomainId("");
      await loadPage();
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to replace domain.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunNow = async () => {
    try {
      setActionLoading(true);
      await monitoringService.runBrandNow(id);
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to run brand monitoring.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="empty-state">Loading brand details...</div>;
  }

  if (pageError) {
    return <div className="error-box">{pageError}</div>;
  }

  if (!brand) {
    return <div className="empty-state">Brand not found.</div>;
  }

  const screenshotUrl = brand.lastScreenshot
    ? `${imageBase}${brand.lastScreenshot}`
    : "";

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{brand.name}</h2>
          <p>
            Brand code: <strong>{brand.code}</strong>
          </p>
        </div>

        <div className="actions-row">
          {canManage && (
            <button
              className="btn btn-primary"
              onClick={handleRunNow}
              disabled={actionLoading}
            >
              {actionLoading ? "Working..." : "Run Now"}
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => { loadPage(); loadHistory(); }}>
            Refresh
          </button>
        </div>
      </div>

      <div className="details-grid page-section">
        <div className="form-card">
          <h3 className="section-title">Brand Summary</h3>

          {screenshotUrl ? (
            <div className="brand-shot-wrap">
              <img
                src={screenshotUrl}
                alt={`${brand.name} latest screenshot`}
                className="brand-shot"
              />
            </div>
          ) : (
            <div className="empty-state">No screenshot captured yet.</div>
          )}

          <div className="detail-list page-section">
            <div className="detail-item">
              <span>Status</span>
              <strong className={`status-pill ${brand.lastStatus}`}>{brand.lastStatus}</strong>
            </div>

            <div className="detail-item">
              <span>Monitoring</span>
              <strong>{brand.monitoringEnabled ? "Enabled" : "Disabled"}</strong>
            </div>

            <div className="detail-item">
              <span>Active Domain</span>
              <strong>{brand.activeDomain?.domain || "No domain assigned"}</strong>
            </div>

            <div className="detail-item">
              <span>Last Checked</span>
              <strong>
                {brand.lastCheckedAt
                  ? new Date(brand.lastCheckedAt).toLocaleString()
                  : "-"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Description</span>
              <strong>{brand.description || "-"}</strong>
            </div>

            <div className="detail-item">
              <span>Notes</span>
              <strong>{brand.notes || "-"}</strong>
            </div>
          </div>

          {brand.activeDomain && (
            <div className="page-section">
              <h4 className="mini-title">Current Active Domain</h4>
              <div className="domain-info-box">
                <p><strong>Domain:</strong> {brand.activeDomain.domain}</p>
                <p><strong>Protocol:</strong> {brand.activeDomain.protocol}</p>
                <p><strong>Status:</strong> {brand.activeDomain.status}</p>
                <p><strong>Health:</strong> {brand.activeDomain.lastKnownHealth}</p>
              </div>

              {canManage && (
                <button
                  className="btn btn-danger"
                  onClick={handleUnassign}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Working..." : "Unassign Active Domain"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="form-card">
          <h3 className="section-title">Replace / Assign Domain</h3>

          {!canManage ? (
            <div className="empty-state">You have view-only access.</div>
          ) : (
            <>
              <label className="field">
                <span>Select Available Domain</span>
                <select
                  className="select-input"
                  value={selectedDomainId}
                  onChange={(e) => setSelectedDomainId(e.target.value)}
                >
                  <option value="">Choose a domain</option>
                  {availableDomains.map((domain) => (
                    <option key={domain._id} value={domain._id}>
                      {domain.domain}
                    </option>
                  ))}
                </select>
              </label>

              <div className="actions-row">
                {!brand.activeDomain ? (
                  <button
                    className="btn btn-primary"
                    onClick={handleAssign}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Assigning..." : "Assign Domain"}
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={handleReplace}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Replacing..." : "Replace Current Domain"}
                  </button>
                )}
              </div>

              <div className="page-section">
                <h4 className="mini-title">Available Domains</h4>
                <div className="available-list">
                  {availableDomains.length ? (
                    availableDomains.slice(0, 30).map((domain) => (
                      <div key={domain._id} className="available-item">
                        <span>{domain.domain}</span>
                        <small>{domain.protocol}</small>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">No available domains found.</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="table-card page-section">
        <div className="section-row">
          <h3 className="section-title">Monitoring History</h3>
          <button className="btn btn-secondary btn-sm" onClick={loadHistory}>
            Refresh History
          </button>
        </div>

        {historyLoading ? (
          <div className="empty-state">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="empty-state">No monitoring history available yet.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Checked At</th>
                <th>Domain</th>
                <th>Status</th>
                <th>Response Time</th>
                <th>Screenshot</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => {
                const logImageUrl = item.imagePath ? `${imageBase}${item.imagePath}` : "";

                return (
                  <tr key={item._id}>
                    <td>{new Date(item.checkedAt).toLocaleString()}</td>
                    <td>{item.domain?.domain || brand?.activeDomain?.domain || "-"}</td>
                    <td>
                      <span className={`status-pill ${item.status}`}>{item.status}</span>
                    </td>
                    <td>{item.responseTimeMs ? `${item.responseTimeMs} ms` : "-"}</td>
                    <td>
                      {logImageUrl ? (
                        <a
                          href={logImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="history-link"
                        >
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default BrandDetailsPage;