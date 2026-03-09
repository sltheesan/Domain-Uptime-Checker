import { useMemo, useState } from "react";
import BrandBadge from "../common/BrandBadge";
import { domainService } from "../../features/domains/domainService";

const normalizeDomainInput = (value = "") => {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "")
    .split("/")[0];
};

function BrandMonitorCard({ brand, canManage, availableDomains = [], onDomainChanged }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState("https");
  const [domainInput, setDomainInput] = useState(brand?.activeDomain?.domain || "");
  const [linkedDomainId, setLinkedDomainId] = useState("");

  const imageUrl = brand?.lastScreenshot
    ? `${import.meta.env.VITE_API_URL?.replace("/api", "")}${brand.lastScreenshot}`
    : "";

  const checkedAt = brand?.lastCheckedAt
    ? new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).format(new Date(brand.lastCheckedAt))
    : "Belum diperiksa";

  const linkedDomains = useMemo(() => {
    const map = new Map();
    (brand?.candidateDomains || []).forEach((item) => {
      if (item?._id) {
        map.set(String(item._id), item);
      }
    });
    if (brand?.activeDomain?._id) {
      map.set(String(brand.activeDomain._id), brand.activeDomain);
    }
    return Array.from(map.values());
  }, [brand?.candidateDomains, brand?.activeDomain]);

  const visitUrl = brand?.activeDomain?.domain
    ? `${brand?.activeDomain?.protocol || "https"}://${brand.activeDomain.domain}`
    : "";

  const openEditor = () => {
    setDomainInput(brand?.activeDomain?.domain || "");
    setLinkedDomainId("");
    setEditing(true);
  };

  const closeEditor = () => {
    if (!saving) {
      setEditing(false);
    }
  };

  const handleApplyTypedDomain = async () => {
    const normalized = normalizeDomainInput(domainInput);

    if (!normalized) {
      alert("Enter a valid domain first.");
      return;
    }

    const activeDomainId = brand?.activeDomain?._id || "";
    const currentActiveDomain = normalizeDomainInput(brand?.activeDomain?.domain || "");

    if (normalized === currentActiveDomain) {
      return;
    }

    const linkedMatch = linkedDomains.find(
      (item) => normalizeDomainInput(item?.domain || "") === normalized
    );
    const availableMatch = availableDomains.find(
      (item) => normalizeDomainInput(item?.domain || "") === normalized
    );

    try {
      setSaving(true);

      if (linkedMatch?._id && activeDomainId) {
        await domainService.setActiveDomain(activeDomainId, linkedMatch._id);
      } else if (availableMatch?._id) {
        await domainService.addDomainToBrand(availableMatch._id, brand._id);
        if (activeDomainId) {
          await domainService.setActiveDomain(activeDomainId, availableMatch._id);
        }
      } else {
        const created = await domainService.createDomain({
          domain: normalized,
          protocol: selectedProtocol,
          brandId: brand._id
        });

        const createdId = created?.domain?._id;
        if (activeDomainId && createdId) {
          await domainService.setActiveDomain(activeDomainId, createdId);
        }
      }

      await onDomainChanged?.();
      setEditing(false);
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to update domain.");
    } finally {
      setSaving(false);
    }
  };

  const handleSetActiveFromLinked = async () => {
    if (!linkedDomainId || !brand?.activeDomain?._id) return;
    if (String(linkedDomainId) === String(brand.activeDomain._id)) return;

    try {
      setSaving(true);
      await domainService.setActiveDomain(brand.activeDomain._id, linkedDomainId);
      await onDomainChanged?.();
      setEditing(false);
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to set active domain.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="monitor-card mobile-card">
      <div className="mobile-card-head">
        <div className="mobile-card-head-top">
          <BrandBadge code={brand?.code} className="mobile-brand-badge" />
          {visitUrl ? (
            <a className="visit-link" href={visitUrl} target="_blank" rel="noreferrer">
              Visit
            </a>
          ) : null}
        </div>
        <p className="domain-label" title={brand?.activeDomain?.domain}>
          {brand?.activeDomain?.domain || "No active domain assigned"}
        </p>
      </div>

      <div className="monitor-preview real-preview mobile-preview">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${brand?.code || "Brand"} latest screenshot`}
            className="monitor-image"
          />
        ) : (
          <div className="monitor-placeholder">
            <span>No Screenshot Yet</span>
          </div>
        )}
      </div>

      {canManage ? (
        <div className="domain-editor">
          <button
            className="btn btn-secondary btn-sm full-width"
            onClick={openEditor}
            disabled={saving}
          >
            Edit Domain
          </button>
        </div>
      ) : null}

      <div className="mobile-card-footer">
        <small>{checkedAt} WIB</small>
      </div>

      {editing ? (
        <div className="domain-modal-overlay" onClick={closeEditor}>
          <div className="domain-modal" onClick={(e) => e.stopPropagation()}>
            <div className="domain-modal-head">
              <h4>Edit Domain</h4>
              <button className="btn btn-secondary btn-sm" onClick={closeEditor} disabled={saving}>
                Close
              </button>
            </div>

            <div className="domain-modal-body">
              <label className="field">
                <span>Type New Domain</span>
                <input
                  className="filter-input"
                  placeholder="Type or paste domain..."
                  list={`domain-suggestions-${brand._id}`}
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                />
                <datalist id={`domain-suggestions-${brand._id}`}>
                  {availableDomains.map((item) => (
                    <option key={item._id} value={item.domain} />
                  ))}
                </datalist>
              </label>

              <div className="domain-editor-row">
                <select
                  className="select-input"
                  value={selectedProtocol}
                  onChange={(e) => setSelectedProtocol(e.target.value)}
                >
                  <option value="https">https</option>
                  <option value="http">http</option>
                </select>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleApplyTypedDomain}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Apply Typed Domain"}
                </button>
              </div>

              <label className="field">
                <span>Set Active From Linked Domains</span>
                <div className="domain-editor-row">
                  <select
                    className="select-input"
                    value={linkedDomainId}
                    onChange={(e) => setLinkedDomainId(e.target.value)}
                  >
                    <option value="">Choose linked domain...</option>
                    {linkedDomains.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.domain}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleSetActiveFromLinked}
                    disabled={saving || !linkedDomainId}
                  >
                    Set Active
                  </button>
                </div>
              </label>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default BrandMonitorCard;
