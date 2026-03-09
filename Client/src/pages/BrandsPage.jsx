import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { brandService } from "../features/brands/brandService";
import { useAuth } from "../hooks/useAuth";

function BrandsPage() {
  const { user } = useAuth();
  const canManage = useMemo(
    () => ["admin", "manager"].includes(user?.role),
    [user]
  );

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    notes: "",
    monitoringEnabled: true
  });

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setTableError("");
      const data = await brandService.getBrands();
      setBrands(data.brands || []);
    } catch (error) {
      setTableError(error?.response?.data?.message || "Failed to load brands.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      await brandService.createBrand(form);
      setForm({
        name: "",
        code: "",
        description: "",
        notes: "",
        monitoringEnabled: true
      });
      await fetchBrands();
    } catch (error) {
      setFormError(error?.response?.data?.message || "Failed to create brand.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleMonitoring = async (brand) => {
    try {
      await brandService.toggleMonitoring(brand._id, !brand.monitoringEnabled);
      await fetchBrands();
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to update monitoring.");
    }
  };

  const handleDelete = async (brand) => {
    const ok = window.confirm(`Delete ${brand.name}?`);
    if (!ok) return;

    try {
      await brandService.deleteBrand(brand._id);
      await fetchBrands();
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to delete brand.");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Brands</h2>
          <p>Manage your 52 brands and open each brand to assign or replace its domain</p>
        </div>
      </div>

      {canManage && (
        <div className="form-card page-section">
          <h3 className="section-title">Create Brand</h3>

          <form onSubmit={handleCreate} className="grid-form">
            <label className="field">
              <span>Brand Name</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Brand Alpha"
                required
              />
            </label>

            <label className="field">
              <span>Brand Code</span>
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="BA"
                required
              />
            </label>

            <label className="field field-full">
              <span>Description</span>
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Short description"
              />
            </label>

            <label className="field field-full">
              <span>Notes</span>
              <input
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Internal notes"
              />
            </label>

            <label className="checkbox-row field-full">
              <input
                type="checkbox"
                name="monitoringEnabled"
                checked={form.monitoringEnabled}
                onChange={handleChange}
              />
              <span>Enable monitoring for this brand</span>
            </label>

            {formError ? <div className="error-box field-full">{formError}</div> : null}

            <div className="field-full">
              <button className="btn btn-primary" disabled={submitting}>
                {submitting ? "Creating..." : "Create Brand"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-card">
        <div className="section-row">
          <h3 className="section-title">Brand List</h3>
          <button className="btn btn-secondary" onClick={fetchBrands}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Loading brands...</div>
        ) : tableError ? (
          <div className="error-box">{tableError}</div>
        ) : brands.length === 0 ? (
          <div className="empty-state">No brands created yet.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Code</th>
                <th>Active Domain</th>
                <th>Status</th>
                <th>Monitoring</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand._id}>
                  <td>{brand.name}</td>
                  <td>{brand.code}</td>
                  <td>{brand.activeDomain?.domain || "-"}</td>
                  <td>
                    <span className={`status-pill ${brand.lastStatus}`}>
                      {brand.lastStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${brand.monitoringEnabled ? "live" : "blocked"}`}>
                      {brand.monitoringEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/brands/${brand._id}`} className="btn btn-secondary btn-sm">
                        Open
                      </Link>

                      {canManage && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleToggleMonitoring(brand)}
                          >
                            {brand.monitoringEnabled ? "Disable" : "Enable"}
                          </button>

                          {user?.role === "admin" && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(brand)}
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
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

export default BrandsPage;