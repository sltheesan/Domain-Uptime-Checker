import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();

  const [form, setForm] = useState({
    usernameOrEmail: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(form.usernameOrEmail, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>Domain Uptime Checker</h1>
          <p>Sign in to access the monitoring dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field">
            <span>Username or Email</span>
            <input
              type="text"
              name="usernameOrEmail"
              value={form.usernameOrEmail}
              onChange={handleChange}
              placeholder="Enter username or email"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
            />
          </label>

          {error ? <div className="error-box">{error}</div> : null}

          <button className="btn btn-primary full-width" disabled={submitting}>
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="demo-box">
          <strong>Sample Admin</strong>
          <p>Username: admin</p>
          <p>Password: Admin@12345</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;