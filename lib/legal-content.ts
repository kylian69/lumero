import fs from "node:fs";
import path from "node:path";

export function readLegalDoc(filename: string): string {
  const filePath = path.join(process.cwd(), "legal", filename);
  return fs.readFileSync(filePath, "utf8");
}
