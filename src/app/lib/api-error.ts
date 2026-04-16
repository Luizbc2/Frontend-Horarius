import { ApiError } from "./api";
import type { ApiErrorInput } from "../types/http";

export function getApiErrorMessage(error: ApiErrorInput, fallbackMessage: string): string {
  if (error instanceof ApiError && error.message.trim()) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

export function isApiErrorWithStatus(error: ApiErrorInput, status: number): error is ApiError {
  return error instanceof ApiError && error.status === status;
}

export function isMissingAuthTokenError(error: ApiErrorInput): boolean {
  const normalizedMessage =
    error instanceof ApiError
      ? error.message
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      : "";

  return (
    error instanceof ApiError &&
    error.status === 401 &&
    normalizedMessage === "o token de autenticacao e obrigatorio."
  );
}
