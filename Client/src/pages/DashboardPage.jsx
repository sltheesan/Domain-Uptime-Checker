import { useEffect, useMemo, useState } from "react";
import DashboardStatCard from "../components/dashboard/DashboardStatCard";
import BrandMonitorCard from "../components/dashboard/BrandMonitorCard";
import { monitoringService } from "../features/monitoring/monitoringService";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";

function DashboardPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const canManage = ["admin", "manager"].includes(user?.role);

  const [summary, setSummary] = useState({
    totalBrands: 0,
    healthyCount: 0,
    blockedCount: 0,
    monitoringEnabledCount: 0
  });
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");
  const [running, setRunning] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setPageError("");

      const data = await monitoringService.getDashboardSummary();
      setSummary(
        data.summary || {
          totalBrands: 0,
          healthyCount: 0,
          blockedCount: 0,
          monitoringEnabledCount: 0
        }
      );
      setBrands(data.brands || []);
    } catch (error) {
      setPageError(error?.response?.data?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onDashboardUpdated = (payload) => {
      setSummary(payload.summary || {});
      setBrands(payload.brands || []);
    };

    socket.on("dashboard:updated", onDashboardUpdated);

    return () => {
      socket.off("dashboard:updated", onDashboardUpdated);
    };
  }, [socket]);

  const filteredBrands = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return brands;

    return brands.filter((brand) => {
      const name = brand?.name?.toLowerCase() || "";
      const code = brand?.code?.toLowerCase() || "";
      const domain = brand?.activeDomain?.domain?.toLowerCase() || "";
      return name.includes(value) || code.includes(value) || domain.includes(value);
    });
  }, [brands, search]);

  const handleRunNow = async () => {
    try {
      setRunning(true);
      await monitoringService.runNow();
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to run monitoring.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Monitoring Dashboard</h2>
          <p>Live overview of all brands, active domains, and latest screenshot status</p>
        </div>

        <div className="actions-row">
          {canManage && (
            <button className="btn btn-primary" onClick={handleRunNow} disabled={running}>
              {running ? "Running..." : "Run Monitoring Now"}
            </button>
          )}
          <button className="btn btn-secondary" onClick={loadDashboard}>
            Refresh
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <DashboardStatCard title="Total Brands" value={summary.totalBrands} subtitle="Configured in the system" />
        <DashboardStatCard title="Healthy" value={summary.healthyCount} subtitle="Currently marked live" />
        <DashboardStatCard title="Attention Needed" value={summary.blockedCount} subtitle="Blocked, dead, timeout, or error" />
        <DashboardStatCard title="Monitoring Enabled" value={summary.monitoringEnabledCount} subtitle="Ready for interval checks" />
      </div>

      <div className="table-card page-section">
        <div className="section-row wrap-row">
          <h3 className="section-title">Brand Monitoring Grid</h3>
          <div className="filter-row">
            <input
              className="filter-input"
              placeholder="Search by brand, code, or domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading dashboard...</div>
        ) : pageError ? (
          <div className="error-box">{pageError}</div>
        ) : filteredBrands.length === 0 ? (
          <div className="empty-state">No brands found for the current filter.</div>
        ) : (
          <div className="monitor-grid">
            {filteredBrands.map((brand) => (
              <BrandMonitorCard key={brand._id} brand={brand} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;