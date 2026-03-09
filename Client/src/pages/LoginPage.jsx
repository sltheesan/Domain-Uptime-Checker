import { useEffect, useState } from "react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showErrorGif, setShowErrorGif] = useState(false);
  const [showErrorText, setShowErrorText] = useState(false);

  useEffect(() => {
    if (!error) {
      setShowErrorGif(false);
      setShowErrorText(false);
      return;
    }

    setShowErrorGif(true);
    setShowErrorText(true);
    const timeoutId = setTimeout(() => {
      setShowErrorGif(false);
      setShowErrorText(false);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [error]);

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
        {error && showErrorGif ? (
          <div className="password-error-float" aria-live="polite">
            <strong>Wrong Password !!!</strong>
            <img
              src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExZjhreXhybHQwNHhibG42anEwZTNzbXpmaTE0MmJzeXNyOHh0b2Z6bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ckVGTpFkihhUCJle7t/giphy.gif"
              alt="Wrong password animation"
              className="password-error-gif"
            />
          </div>
        ) : null}

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
            <div className="password-field-wrap">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </label>

          {error && showErrorText ? <div className="error-box">{error}</div> : null}

          <button className="btn btn-primary full-width" disabled={submitting}>
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>

      </div>
    </div>
  );
}

export default LoginPage;
