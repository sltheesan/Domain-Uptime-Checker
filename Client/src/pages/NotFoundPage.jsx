import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="page-center">
      <h1>404</h1>
      <p>Page not found.</p>
      <Link to="/dashboard" className="btn btn-primary">
        Go to Dashboard
      </Link>
    </div>
  );
}

export default NotFoundPage;