import { useEffect, useState } from "react";
import { userService } from "../features/users/userService";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
    isActive: true
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      setPageError("");
      const data = await userService.getUsers();
      setUsers(data.users || []);
    } catch (error) {
      setPageError(error?.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
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
    setSubmitting(true);
    setPageError("");

    try {
      await userService.createUser(form);
      setForm({
        username: "",
        email: "",
        password: "",
        role: "user",
        isActive: true
      });
      await loadUsers();
    } catch (error) {
      setPageError(error?.response?.data?.message || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (user) => {
    try {
      await userService.updateUser(user._id, {
        isActive: !user.isActive
      });
      await loadUsers();
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to update user.");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Users</h2>
          <p>Manage admins, managers, and users</p>
        </div>
      </div>

      <div className="details-grid page-section">
        <div className="form-card">
          <h3 className="section-title">Create User</h3>

          <form onSubmit={handleCreate} className="grid-form">
            <label className="field">
              <span>Username</span>
              <input name="username" value={form.username} onChange={handleChange} required />
            </label>

            <label className="field">
              <span>Email</span>
              <input name="email" type="email" value={form.email} onChange={handleChange} required />
            </label>

            <label className="field">
              <span>Password</span>
              <input name="password" type="password" value={form.password} onChange={handleChange} required />
            </label>

            <label className="field">
              <span>Role</span>
              <select className="select-input" name="role" value={form.role} onChange={handleChange}>
                <option value="user">user</option>
                <option value="manager">manager</option>
                <option value="admin">admin</option>
              </select>
            </label>

            <label className="checkbox-row field-full">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
              />
              <span>Active account</span>
            </label>

            <div className="field-full">
              <button className="btn btn-primary" disabled={submitting}>
                {submitting ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>

        <div className="table-card">
          <div className="section-row">
            <h3 className="section-title">User List</h3>
            <button className="btn btn-secondary btn-sm" onClick={loadUsers}>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="empty-state">Loading users...</div>
          ) : pageError ? (
            <div className="error-box">{pageError}</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item._id}>
                    <td>{item.username}</td>
                    <td>{item.email}</td>
                    <td>{item.role}</td>
                    <td>{item.isActive ? "Active" : "Inactive"}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => toggleStatus(item)}
                      >
                        {item.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default UsersPage;