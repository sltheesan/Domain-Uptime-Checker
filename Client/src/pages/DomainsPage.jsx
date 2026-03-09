import { useEffect, useMemo, useState } from "react";
import { domainService } from "../features/domains/domainService";
import { useAuth } from "../hooks/useAuth";

function DomainsPage() {
  const { user } = useAuth();
  const canManage = useMemo(
    () => ["admin", "manager"].includes(user?.role),
    [user]
  );

  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [formError, setFormError] = useState("");
  const [importMessage, setImportMessage] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    status: ""
  });

  const [form, setForm] = useState({
    domain: "",
    protocol: "https",
    notes: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchDomains = async (customFilters = filters) => {
    try {
      setLoading(true);
      setTableError("");

      const params = {};
      if (customFilters.search) params.search = customFilters.search;
      if (customFilters.status) params.status = customFilters.status;

      const data = await domainService.getDomains(params);
      setDomains(data.domains || []);
    } catch (error) {
      setTableError(error?.response?.data?.message || "Failed to load domains.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const applyFilters = () => {
    fetchDomains(filters);
  };

  const resetFilters = () => {
    const next = { search: "", status: "" };
    setFilters(next);
    fetchDomains(next);
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      await domainService.createDomain(form);
      setForm({
        domain: "",
        protocol: "https",
        notes: ""
      });
      await fetchDomains();
    } catch (error) {
      setFormError(error?.response?.data?.message || "Failed to create domain.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (domain) => {
    const ok = window.confirm(`Delete ${domain.domain}?`);
    if (!ok) return;

    try {
      await domainService.deleteDomain(domain._id);
      await fetchDomains();
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to delete domain.");
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportMessage("");
    setUploading(true);

    try {
      const result = await domainService.importCsv(file);
      setImportMessage(
        `${result.message} Imported: ${result.importedCount}, Skipped: ${result.skippedCount}`
      );
      await fetchDomains();
    } catch (error) {
      setImportMessage(error?.response?.data?.message || "CSV import failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Domains</h2>
          <p>Import, add, filter, and manage your domain pool</p>
        </div>
      </div>

      {canManage && (
        <div className="details-grid page-section">
          <div className="form-card">
            <h3 className="section-title">Add Domain</h3>

            <form onSubmit={handleCreate} className="grid-form">
              <label className="field field-full">
                <span>Domain</span>
                <input
                  name="domain"
                  value={form.domain}
                  onChange={handleFormChange}
                  placeholder="example.com"
                  required
                />
              </label>

              <label className="field">
                <span>Protocol</span>
                <select
                  className="select-input"
                  name="protocol"
                  value={form.protocol}
                  onChange={handleFormChange}
                >
                  <option value="https">https</option>
                  <option value="http">http</option>
                </select>
              </label>

              <label className="field field-full">
                <span>Notes</span>
                <input
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  placeholder="Optional notes"
                />
              </label>

              {formError ? <div className="error-box field-full">{formError}</div> : null}

              <div className="field-full">
                <button className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Domain"}
                </button>
              </div>
            </form>
          </div>

          <div className="form-card">
            <h3 className="section-title">Import CSV</h3>
            <p className="muted-text">
              Upload a CSV with one domain per row or a first column named domain.
            </p>

            <label className="upload-box">
              <input type="file" accept=".csv" onChange={handleCsvUpload} hidden />
              <span>{uploading ? "Uploading..." : "Choose CSV File"}</span>
            </label>

            {importMessage ? <div className="info-box">{importMessage}</div> : null}
          </div>
        </div>
      )}

      <div className="table-card">
        <div className="section-row wrap-row">
          <h3 className="section-title">Domain Pool</h3>

          <div className="filter-row">
            <input
              className="filter-input"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search domain..."
            />

            <select
              className="select-input"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All statuses</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="blocked">Blocked</option>
              <option value="inactive">Inactive</option>
            </select>

            <button className="btn btn-secondary btn-sm" onClick={applyFilters}>
              Apply
            </button>
            <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
              Reset
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading domains...</div>
        ) : tableError ? (
          <div className="error-box">{tableError}</div>
        ) : domains.length === 0 ? (
          <div className="empty-state">No domains found.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Protocol</th>
                <th>Status</th>
                <th>Assigned Brand</th>
                <th>Health</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((domain) => (
                <tr key={domain._id}>
                  <td>{domain.domain}</td>
                  <td>{domain.protocol}</td>
                  <td>{domain.status}</td>
                  <td>{domain.assignedBrand?.name || "-"}</td>
                  <td>
                    <span className={`status-pill ${domain.lastKnownHealth}`}>
                      {domain.lastKnownHealth}
                    </span>
                  </td>
                  <td>
                    {user?.role === "admin" ? (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(domain)}
                        disabled={domain.status === "assigned"}
                      >
                        Delete
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default DomainsPage;