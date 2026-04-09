import { ApiError } from "./api";

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof ApiError && error.message.trim()) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

export function isApiErrorWithStatus(error: unknown, status: number): error is ApiError {
  return error instanceof ApiError && error.status === status;
}

export function isMissingAuthTokenError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 401 &&
    error.message.trim().toLowerCase() === "o token de autenticacao e obrigatorio."
  );
}
