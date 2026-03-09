import { getBrandStyle } from "../../constants/brandStyles";

function BrandBadge({ code, className = "" }) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  const style = getBrandStyle(normalizedCode);

  return (
    <span className={`brand-badge ${className}`.trim()} style={style}>
      {normalizedCode || "-"}
    </span>
  );
}

export default BrandBadge;
