import { useEffect, useState } from "react";
import { settingsService } from "../features/settings/settingsService";

function SettingsPage() {
  const [form, setForm] = useState({
    screenshotIntervalMinutes: 5,
    screenshotTimeoutMs: 30000,
    screenshotConcurrency: 4
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSettings = async () => {
    try {
      setLoading(true);
      setPageError("");
      const data = await settingsService.getSettings();

      if (data?.settings) {
        setForm({
          screenshotIntervalMinutes: data.settings.screenshotIntervalMinutes ?? 5,
          screenshotTimeoutMs: data.settings.screenshotTimeoutMs ?? 30000,
          screenshotConcurrency: data.settings.screenshotConcurrency ?? 4
        });
      }
    } catch (error) {
      setPageError(error?.response?.data?.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e) => {
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setPageError("");
    setSuccess("");

    try {
      const payload = {
        screenshotIntervalMinutes: Number(form.screenshotIntervalMinutes),
        screenshotTimeoutMs: Number(form.screenshotTimeoutMs),
        screenshotConcurrency: Number(form.screenshotConcurrency)
      };

      const data = await settingsService.updateSettings(payload);

      setForm({
        screenshotIntervalMinutes: data.settings.screenshotIntervalMinutes,
        screenshotTimeoutMs: data.settings.screenshotTimeoutMs,
        screenshotConcurrency: data.settings.screenshotConcurrency
      });

      setSuccess("Settings saved successfully.");
    } catch (error) {
      setPageError(error?.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p>Configure monitoring interval, timeout, and concurrency</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="form-card">
          <h3 className="section-title">Monitoring Settings</h3>

          {loading ? (
            <div className="empty-state">Loading settings...</div>
          ) : (
            <form onSubmit={handleSave} className="grid-form">
              <label className="field field-full">
                <span>Screenshot Interval (minutes)</span>
                <input
                  type="number"
                  min="1"
                  name="screenshotIntervalMinutes"
                  value={form.screenshotIntervalMinutes}
                  onChange={handleChange}
                />
              </label>

              <label className="field field-full">
                <span>Timeout (milliseconds)</span>
                <input
                  type="number"
                  min="5000"
                  name="screenshotTimeoutMs"
                  value={form.screenshotTimeoutMs}
                  onChange={handleChange}
                />
              </label>

              <label className="field field-full">
                <span>Concurrency</span>
                <input
                  type="number"
                  min="1"
                  name="screenshotConcurrency"
                  value={form.screenshotConcurrency}
                  onChange={handleChange}
                />
              </label>

              {pageError ? <div className="error-box field-full">{pageError}</div> : null}
              {success ? <div className="info-box field-full">{success}</div> : null}

              <div className="field-full">
                <button className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;