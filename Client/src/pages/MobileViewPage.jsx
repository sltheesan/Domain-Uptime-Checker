import { Link, useSearchParams } from "react-router-dom";

function MobileViewPage() {
  const [searchParams] = useSearchParams();
  const rawUrl = searchParams.get("url") || "";

  const isValidUrl = (() => {
    try {
      const parsed = new URL(rawUrl);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  })();

  return (
    <div className="mobile-view-page">
      <div className="mobile-view-top">
        <Link to="/dashboard" className="btn btn-secondary btn-sm">
          Back
        </Link>
        {isValidUrl ? (
          <a className="btn btn-primary btn-sm" href={rawUrl} target="_blank" rel="noreferrer">
            Open Direct
          </a>
        ) : null}
      </div>

      {isValidUrl ? (
        <div className="mobile-device-shell">
          <iframe
            title="Mobile Preview"
            src={rawUrl}
            className="mobile-device-iframe"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="empty-state">Invalid or missing URL for mobile preview.</div>
      )}
    </div>
  );
}

export default MobileViewPage;
