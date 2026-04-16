export function normalizeCpf(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function formatCpf(value: string) {
  const digits = normalizeCpf(value);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function validateCpf(value: string) {
  const digits = normalizeCpf(value);

  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  const numbers = digits.split("").map(Number);
  const firstCheck = numbers
    .slice(0, 9)
    .reduce((total, digit, index) => total + digit * (10 - index), 0);
  const firstRemainder = (firstCheck * 10) % 11;
  const firstDigit = firstRemainder === 10 ? 0 : firstRemainder;

  if (firstDigit !== numbers[9]) {
    return false;
  }

  const secondCheck = numbers
    .slice(0, 10)
    .reduce((total, digit, index) => total + digit * (11 - index), 0);
  const secondRemainder = (secondCheck * 10) % 11;
  const secondDigit = secondRemainder === 10 ? 0 : secondRemainder;

  return secondDigit === numbers[10];
}
