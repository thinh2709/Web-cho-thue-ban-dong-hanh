import fs from "node:fs/promises";
import path from "node:path";

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJson(filePath, defaultValue) {
  if (!(await fileExists(filePath))) return defaultValue;
  const text = await fs.readFile(filePath, "utf8");
  if (!text) return defaultValue;
  return JSON.parse(text);
}

export async function writeJson(filePath, value) {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(tmp, filePath);
}
