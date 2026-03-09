import { useAuth } from "../../hooks/useAuth";

function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div>
        <h1 className="topbar-title">Brand Domain Monitor</h1>
        <p className="topbar-subtitle">Monitor active domains and screenshots</p>
      </div>

      <div className="topbar-right">
        <div className="user-chip">
          <span>{user?.username}</span>
          <small>{user?.role}</small>
        </div>
        <button className="btn btn-secondary" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Topbar;