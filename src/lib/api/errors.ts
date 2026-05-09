export type ErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "VALIDATION_ERROR" | "INTERNAL_ERROR";

export class ApiError extends Error {
  code: ErrorCode;
  status: number;

  constructor(message: string, code: ErrorCode, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }

  toJSON() {
    return { error: this.message, code: this.code };
  }
}

export function unauthorized(message = "未登录或会话已过期") {
  return new ApiError(message, "UNAUTHORIZED", 401);
}

export function forbidden(message = "无权执行此操作") {
  return new ApiError(message, "FORBIDDEN", 403);
}

export function validationError(message: string) {
  return new ApiError(message, "VALIDATION_ERROR", 400);
}

export function internalError(message = "服务器内部错误") {
  return new ApiError(message, "INTERNAL_ERROR", 500);
}
