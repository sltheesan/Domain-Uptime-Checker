import { useAuth } from "../../hooks/useAuth";

const getInitials = (value = "") => {
  const words = String(value).trim().split(/\s+/).filter(Boolean);

  if (!words.length) return "U";
  if (words.length === 1) return words[0][0]?.toUpperCase() || "U";

  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
};

function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const displayName = user?.username || "User";
  const initials = getInitials(displayName);

  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar-menu-btn"
        onClick={onMenuClick}
        aria-label="Toggle navigation menu"
      >
        <svg
          className="topbar-menu-icon"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>

      <div>
        <h1 className="topbar-title">Brand Domain Monitor</h1>
        <p className="topbar-subtitle">Monitor active domains and screenshots</p>
      </div>

      <div className="topbar-right">
        <div className="user-chip">
          <div className="user-chip-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="user-chip-meta">
            <span>{displayName}</span>
            <small>{user?.role}</small>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Topbar;
