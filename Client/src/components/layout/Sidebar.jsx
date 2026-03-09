import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>DUC</h2>
        <p>Domain Uptime Checker</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className="nav-item">
          Dashboard
        </NavLink>

        <NavLink to="/brands" className="nav-item">
          Brands
        </NavLink>

        <NavLink to="/domains" className="nav-item">
          Domain Pool
        </NavLink>

        {user?.role === "admin" && (
          <>
            <NavLink to="/users" className="nav-item">
              Users
            </NavLink>

            <NavLink to="/settings" className="nav-item">
              Settings
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;