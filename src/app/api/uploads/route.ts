import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { apiError, requirePermission } from "@/lib/api-utils";

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
  const auth = requirePermission(request, "submitLearningContent");
  if ("response" in auth) return auth.response;
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return apiError("上传请求格式无效。", 400, "VALIDATION_ERROR");
  }
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return apiError("未收到图片文件。", 400, "VALIDATION_ERROR");
  }

  if (!file.type.startsWith("image/") || !extensionByMime[file.type]) {
    return apiError("仅支持 jpg、png、webp、gif 图片。", 415, "UNSUPPORTED_MEDIA_TYPE");
  }

  if (file.size > maxImageSize) {
    return apiError("图片不能超过 5MB。", 413, "PAYLOAD_TOO_LARGE");
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
