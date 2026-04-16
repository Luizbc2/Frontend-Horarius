import { LockKeyhole } from "lucide-react";

import { SectionCard } from "../PageShell";
import { Input } from "../ui/input";
import { FIELD_LIMITS } from "../../lib/field-rules";

type ProfileSecuritySectionProps = {
  password: string;
  confirmPassword: string;
  passwordError?: string;
  confirmPasswordError?: string;
  onChange: (field: "password" | "confirmPassword", value: string) => void;
};

export function ProfileSecuritySection({
  password,
  confirmPassword,
  passwordError,
  confirmPasswordError,
  onChange,
}: ProfileSecuritySectionProps) {
  return (
    <SectionCard
      title="Seguranca"
      description="Digite a nova senha e repita o mesmo valor no campo ao lado."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="profile-password">Nova senha</label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profile-password"
              type="password"
              value={password}
              onChange={(event) => onChange("password", event.target.value)}
              className="pl-11"
              placeholder="Use 8+ caracteres, maiuscula e numero"
              autoComplete="new-password"
              aria-invalid={Boolean(passwordError)}
              maxLength={FIELD_LIMITS.password}
            />
          </div>
          {passwordError ? (
            <p className="min-h-[1.25rem] text-sm text-destructive">{passwordError}</p>
          ) : (
            <p className="min-h-[1.25rem] text-sm text-muted-foreground">
              Use 8 ou mais caracteres, com letra maiuscula, minuscula e numero.
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <label htmlFor="profile-confirm-password">Confirmar senha</label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profile-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => onChange("confirmPassword", event.target.value)}
              className="pl-11"
              placeholder="Repita exatamente a nova senha"
              autoComplete="new-password"
              aria-invalid={Boolean(confirmPasswordError)}
              maxLength={FIELD_LIMITS.password}
            />
          </div>
          {confirmPasswordError ? (
            <p className="min-h-[1.25rem] text-sm text-destructive">{confirmPasswordError}</p>
          ) : (
            <p className="min-h-[1.25rem] text-sm text-muted-foreground">
              Digite novamente a nova senha.
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
