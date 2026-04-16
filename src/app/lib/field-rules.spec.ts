import { describe, expect, test } from "vitest";

import {
  normalizeCurrencyInput,
  normalizeEmailInput,
  normalizePositiveIntegerInput,
  validateCurrencyField,
  validatePhoneField,
} from "./field-rules";

describe("field rules", () => {
  test("normalizes decimal and integer inputs without negative values", () => {
    expect(normalizePositiveIntegerInput("-45min", 4)).toBe("45");
    expect(normalizeCurrencyInput("-12a3,456")).toBe("123,45");
  });

  test("normalizes email input by removing spaces", () => {
    expect(normalizeEmailInput("  LUIZ @EMAIL.COM ")).toBe("LUIZ@EMAIL.COM");
  });

  test("validates phone and currency fields", () => {
    expect(validatePhoneField("11999999999")).toBeUndefined();
    expect(validatePhoneField("abc")).toBe("Digite um telefone valido com DDD.");
    expect(validateCurrencyField("-10", "O preço")).toBe("O preço deve ser um valor positivo ou zero.");
  });
});
