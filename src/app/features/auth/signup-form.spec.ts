import { describe, expect, test } from "vitest";

import { ApiError } from "../../lib/api";
import {
  createSignupPayload,
  mapSignupApiError,
  mapSignupSuccessMessage,
  validateSignupForm,
} from "./signup-form";

describe("signup form helpers", () => {
  test("returns field errors when required data is missing or invalid", () => {
    expect(
      validateSignupForm({
        name: "A",
        email: "email-invalido",
        cpf: "123.456.789-00",
        password: "",
        confirmPassword: "outra",
      }),
    ).toEqual({
      name: "O nome precisa ter pelo menos 2 caracteres.",
      email: "Digite um e-mail valido.",
      cpf: "Digite um CPF válido.",
      password: "Informe uma senha.",
      confirmPassword: "As senhas precisam ser iguais.",
      submit: "Revise os campos destacados antes de continuar.",
    });
  });

  test("creates the API payload with normalized values", () => {
    expect(
      createSignupPayload({
        name: "  Luiz Barbosa  ",
        email: "  LUIZ@EMAIL.COM  ",
        cpf: "529.982.247-25",
        password: "Senha123",
        confirmPassword: "Senha123",
      }),
    ).toEqual({
      name: "Luiz Barbosa",
      email: "luiz@email.com",
      cpf: "52998224725",
      password: "Senha123",
    });
  });

  test("maps common API messages to friendly form feedback", () => {
    expect(mapSignupSuccessMessage("Usuário cadastrado com sucesso.")).toBe(
      "Conta criada com sucesso. Agora você já pode entrar no painel.",
    );

    expect(
      mapSignupApiError({
        status: 409,
        message: "E-mail já está em uso.",
      } as never),
    ).toEqual({
      submit: "Não foi possível concluir o cadastro agora.",
    });

    expect(
      mapSignupApiError(new ApiError("E-mail já está em uso.", 409)),
    ).toEqual({
      email: "Este e-mail já está em uso.",
      submit: "Use outro e-mail para continuar.",
    });

    expect(
      mapSignupApiError(new ApiError("CPF inválido.", 400)),
    ).toEqual({
      cpf: "Digite um CPF válido.",
      submit: "Revise os campos destacados antes de continuar.",
    });
  });
});
