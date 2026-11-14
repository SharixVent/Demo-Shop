// src/api/pocketbase.ts
import PocketBase from "pocketbase";

const rawUrl = import.meta.env.VITE_POCKETBASE_URL;
// Jeśli w .env jest "/" lub pusto, używamy domyślnego lokalnego adresu PocketBase
const pbUrl = !rawUrl || rawUrl === "/" ? "http://127.0.0.1:8090" : rawUrl;

export const pb = new PocketBase(pbUrl);
pb.autoCancellation(false);

export function fileUrl(record: any, fileName: string, thumb?: string): string {
  if (!fileName || typeof fileName !== "string") return "";
  if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
    return fileName;
  }
  return pb.files.getURL(record, fileName, thumb ? { thumb } : undefined);
}

export default pb;