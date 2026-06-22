import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-utils";

const dataRoot = process.env.WUHUA_DATA_DIR || path.join(process.cwd(), ".wuhuan-data");
const uploadRoot = path.join(dataRoot, "uploads");

const mimeByExtension: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif"
};

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const safeName = path.basename(file);
  if (safeName !== file) {
    return apiError("无效文件名。", 400, "VALIDATION_ERROR");
  }

  const ext = safeName.split(".").pop()?.toLowerCase() || "";
  const mimeType = mimeByExtension[ext];
  if (!mimeType) {
    return apiError("不支持的图片类型。", 415, "UNSUPPORTED_MEDIA_TYPE");
  }

  try {
    const bytes = await readFile(path.join(uploadRoot, safeName));
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch {
    return apiError("图片不存在。", 404, "NOT_FOUND");
  }
}
