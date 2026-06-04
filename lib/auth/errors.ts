export class UnauthorizedError extends Error {
  constructor(message = "Anda harus login untuk mengakses fitur ini.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof UnauthorizedError;
}
