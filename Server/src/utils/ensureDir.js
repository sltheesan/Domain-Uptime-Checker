import fs from "fs";
import path from "path";

export const ensureDir = (dirPath) => {
  const resolved = path.resolve(dirPath);

  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true });
  }

  return resolved;
};