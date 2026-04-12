import { CreditCard } from "lucide-react";

import { SectionCard } from "../PageShell";
import { Input } from "../ui/input";

type ProfileIdentitySectionProps = {
  name: string;
  email: string;
  cpf: string;
  nameError?: string;
  cpfError?: string;
  onChange: (field: "name" | "cpf", value: string) => void;
};

export function ProfileIdentitySection({
  name,
  email,
  cpf,
  nameError,
  cpfError,
  onChange,
}: ProfileIdentitySectionProps) {
  return (
    <SectionCard
      title="Dados do usuario"
      description="Aqui voce altera somente os dados da conta que esta logada agora."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="profile-name">Nome</label>
          <Input
            id="profile-name"
            value={name}
            onChange={(event) => onChange("name", event.target.value)}
            aria-invalid={Boolean(nameError)}
          />
          {nameError ? (
            <p className="min-h-[1.25rem] text-sm text-destructive">{nameError}</p>
          ) : (
            <p className="min-h-[1.25rem] text-sm text-muted-foreground">
              Nome exibido no painel da sua conta.
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <label htmlFor="profile-email">E-mail</label>
          <Input id="profile-email" type="email" value={email} disabled readOnly />
          <p className="min-h-[1.25rem] text-sm text-muted-foreground">
            Este campo nao pode ser alterado nesta tela.
          </p>
        </div>

        <div className="grid gap-2 md:col-span-2">
          <label htmlFor="profile-cpf">CPF</label>
          <div className="relative">
            <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profile-cpf"
              type="text"
              value={cpf}
              onChange={(event) => onChange("cpf", event.target.value)}
              className="pl-11"
              inputMode="numeric"
              placeholder="000.000.000-00"
              aria-invalid={Boolean(cpfError)}
            />
          </div>
          {cpfError ? (
            <p className="min-h-[1.25rem] text-sm text-destructive">{cpfError}</p>
          ) : (
            <p className="min-h-[1.25rem] text-sm text-muted-foreground">
              Digite o CPF da conta sem mudar o e-mail cadastrado.
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}


