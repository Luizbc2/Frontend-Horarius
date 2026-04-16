import { formatCpf, normalizeCpf, validateCpf } from "./cpf";

describe("cpf helpers", () => {
  test("normalizes CPF by keeping only digits", () => {
    expect(normalizeCpf("529.982.247-25")).toBe("52998224725");
  });

  test("formats CPF as the user types", () => {
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
    expect(formatCpf("529982")).toBe("529.982");
  });

  test("accepts a valid CPF and rejects an invalid one", () => {
    expect(validateCpf("529.982.247-25")).toBe(true);
    expect(validateCpf("111.111.111-11")).toBe(false);
  });
});
