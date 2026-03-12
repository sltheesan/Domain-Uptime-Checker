import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function Sidebar({ isOpen = false, onClose }) {
  const { user } = useAuth();
  const sidebarClassName = `sidebar${isOpen ? " mobile-open" : ""}`;

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {isOpen && <button className="sidebar-overlay" onClick={onClose} aria-label="Close menu" />}
      <aside className={sidebarClassName}>
        <div className="sidebar-brand">
          <h2>DUC</h2>
          <p>Domain Uptime Checker</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className="nav-item" onClick={handleNavClick}>
            Dashboard
          </NavLink>

          <NavLink to="/brands" className="nav-item" onClick={handleNavClick}>
            Brands
          </NavLink>

          <NavLink to="/domains" className="nav-item" onClick={handleNavClick}>
            Domain Pool
          </NavLink>

          {user?.role === "admin" && (
            <>
              <NavLink to="/users" className="nav-item" onClick={handleNavClick}>
                Users
              </NavLink>

              <NavLink to="/settings" className="nav-item" onClick={handleNavClick}>
                Settings
              </NavLink>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
