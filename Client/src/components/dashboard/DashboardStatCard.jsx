function DashboardStatCard({ title, value, subtitle }) {
  return (
    <div className="stat-card">
      <h3>{value}</h3>
      <p>{title}</p>
      {subtitle ? <small className="stat-subtitle">{subtitle}</small> : null}
    </div>
  );
}

export default DashboardStatCard;