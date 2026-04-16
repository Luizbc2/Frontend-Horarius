import {
  createProfileFormData,
  formatProfileField,
  validatePasswordStrength,
  validateProfileForm,
} from "./profile-form";

describe("profile form helpers", () => {
  test("creates form data from the authenticated user", () => {
    expect(
      createProfileFormData({
        id: 1,
        name: "Luiz",
        email: "luiz@email.com",
        cpf: "52998224725",
      }),
    ).toEqual({
      name: "Luiz",
      email: "luiz@email.com",
      cpf: "529.982.247-25",
      password: "",
      confirmPassword: "",
    });
  });

  test("formats profile fields before saving", () => {
    expect(formatProfileField("name", "  Luiz   Barbosa  ")).toBe("Luiz Barbosa ");
    expect(formatProfileField("cpf", "52998224725")).toBe("529.982.247-25");
  });

  test("validates password strength rules for the profile form", () => {
    expect(validatePasswordStrength("senha123")).toBe("Inclua ao menos uma letra maiúscula na senha.");
    expect(validatePasswordStrength("SenhaForte")).toBe("Inclua ao menos um número na senha.");
  });

  test("returns clear errors when the profile form is invalid", () => {
    expect(
      validateProfileForm({
        name: "A",
        email: "",
        cpf: "123.456.789-00",
        password: "fraca",
        confirmPassword: "outra",
      }),
    ).toEqual({
      name: "O nome precisa ter pelo menos 2 caracteres.",
      email: "O e-mail do usuário precisa estar preenchido.",
      cpf: "Digite um CPF valido.",
      password: "Use pelo menos 8 caracteres na senha.",
      confirmPassword: "As senhas precisam ser iguais.",
      submit: "Revise os campos destacados antes de salvar.",
    });
  });
});
