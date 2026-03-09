export const classifyMonitoringResult = ({
  errorMessage = "",
  statusCode = null,
  content = ""
}) => {
  const text = `${errorMessage} ${content}`.toLowerCase();

  if (text.includes("timeout")) {
    return "error";
  }

  if (
    text.includes("access denied") ||
    text.includes("forbidden") ||
    text.includes("blocked") ||
    text.includes("captcha") ||
    text.includes("attention required")
  ) {
    return "blocked";
  }

  if (
    text.includes("err_name_not_resolved") ||
    text.includes("dns") ||
    text.includes("net::err") ||
    text.includes("connection refused") ||
    text.includes("site can’t be reached") ||
    text.includes("site can't be reached")
  ) {
    return "dead";
  }

  if (typeof statusCode === "number") {
    if (statusCode >= 200 && statusCode < 400) return "live";
    if (statusCode === 403 || statusCode === 429) return "blocked";
    if (statusCode >= 400 && statusCode < 600) return "error";
  }

  if (text.includes("error")) {
    return "error";
  }

  return "error";
};
