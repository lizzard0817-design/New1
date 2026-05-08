import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const dataRoot = process.env.WUHUA_DATA_DIR || path.join(process.cwd(), ".wuhuan-data");
const uploadRoot = path.join(dataRoot, "uploads");
const maxImageSize = 5 * 1024 * 1024;

const extensionByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "未收到图片文件。" }, { status: 400 });
  }

  if (!file.type.startsWith("image/") || !extensionByMime[file.type]) {
    return NextResponse.json({ error: "仅支持 jpg、png、webp、gif 图片。" }, { status: 415 });
  }

  if (file.size > maxImageSize) {
    return NextResponse.json({ error: "图片不能超过 5MB。" }, { status: 413 });
  }

  await mkdir(uploadRoot, { recursive: true });
  const ext = extensionByMime[file.type];
  const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const target = path.join(uploadRoot, filename);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(target, bytes);

  return NextResponse.json({
    asset: {
      url: `/api/uploads/${filename}`,
      name: file.name,
      mimeType: file.type,
      size: file.size
    }
  });
}
