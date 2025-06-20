export function successResponse<T>(message: string, data: T) {
  return {
    success: true,
    message,
    data,
  };
}

export function errorResponse(message: string, code = 400) {
  return {
    success: false,
    message,
    code,
  };
}
