import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

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
    return NextResponse.json({ error: "无效文件名。" }, { status: 400 });
  }

  const ext = safeName.split(".").pop()?.toLowerCase() || "";
  const mimeType = mimeByExtension[ext];
  if (!mimeType) {
    return NextResponse.json({ error: "不支持的图片类型。" }, { status: 415 });
  }

  try {
    const bytes = await readFile(path.join(uploadRoot, safeName));
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return NextResponse.json({ error: "图片不存在。" }, { status: 404 });
  }
}
