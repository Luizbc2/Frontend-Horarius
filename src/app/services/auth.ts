import { api } from "../lib/api";

type AuthUserResponse = {
  id: number;
  name: string;
  email: string;
  cpf: string;
};

type LoginRequest = {
  email: string;
  password: string;
};

export type SignupRequest = {
  name: string;
  email: string;
  cpf: string;
  password: string;
};

export type UpdateProfileRequest = {
  name: string;
  email?: string;
  cpf: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  token: string;
  user: AuthUserResponse;
};

export type SignupResponse = {
  message: string;
  user: AuthUserResponse;
};

export type UpdateProfileResponse = {
  message: string;
  user: AuthUserResponse;
};

export function loginWithApi(input: LoginRequest) {
  return api.post<LoginResponse>("/auth/login", input);
}

export function signupWithApi(input: SignupRequest) {
  return api.post<SignupResponse>("/users", input);
}

export function updateProfileWithApi(input: UpdateProfileRequest, token: string) {
  return api.put<UpdateProfileResponse>("/users/me", input, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
