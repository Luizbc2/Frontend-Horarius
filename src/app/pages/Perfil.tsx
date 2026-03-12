import { ImageIcon, LockKeyhole, ShieldCheck, Sparkles, User } from "lucide-react";

import { MetricCard, PageShell, SectionCard } from "../components/PageShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { cn } from "../components/ui/utils";

const avatarOptions = [
  { id: 1, emoji: "👨", label: "Homem 1" },
  { id: 2, emoji: "👨🏻", label: "Homem 2" },
  { id: 3, emoji: "👨🏼", label: "Homem 3" },
  { id: 4, emoji: "👨🏽", label: "Homem 4" },
  { id: 5, emoji: "👨🏾", label: "Homem 5" },
  { id: 6, emoji: "👨🏿", label: "Homem 6" },
  { id: 7, emoji: "👩", label: "Mulher 1" },
  { id: 8, emoji: "👩🏻", label: "Mulher 2" },
  { id: 9, emoji: "👩🏼", label: "Mulher 3" },
  { id: 10, emoji: "👩🏽", label: "Mulher 4" },
  { id: 11, emoji: "👩🏾", label: "Mulher 5" },
  { id: 12, emoji: "👩🏿", label: "Mulher 6" },
  { id: 13, emoji: "🧑", label: "Pessoa 1" },
  { id: 14, emoji: "🧑🏻", label: "Pessoa 2" },
  { id: 15, emoji: "🧑🏼", label: "Pessoa 3" },
  { id: 16, emoji: "🧑🏽", label: "Pessoa 4" },
];

export function Perfil() {
  return (
    <PageShell
      eyebrow="Conta"
      title="Perfil e seguranca"
      description="Ajuste os dados principais, escolha um avatar mais expressivo e mantenha a conta protegida com um visual mais organizado."
      actions={<Button>Salvar alteracoes</Button>}
    >
      <div className="metric-grid">
        <MetricCard
          label="Perfil"
          value="100%"
          helper="Dados essenciais preenchidos"
          icon={<Sparkles className="h-5 w-5" />}
        />
        <MetricCard
          label="Avatares"
          value={String(avatarOptions.length + 1)}
          helper="Opcoes prontas para personalizacao"
          icon={<ImageIcon className="h-5 w-5" />}
          accent="sand"
        />
        <MetricCard
          label="Seguranca"
          value="Ativa"
          helper="Fluxo pronto para atualizar senha"
          icon={<ShieldCheck className="h-5 w-5" />}
          accent="coral"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SectionCard
          title="Informacoes do perfil"
          description="Mantenha os dados de contato sempre atualizados para garantir uma operacao mais profissional no dia a dia."
        >
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="profile-name">Nome</label>
              <Input id="profile-name" defaultValue="Luiz Teste 1" />
            </div>
            <div className="grid gap-2">
              <label htmlFor="profile-email">Email</label>
              <Input id="profile-email" type="email" defaultValue="luiz@teste.com" />
            </div>
            <div className="grid gap-2">
              <label htmlFor="profile-phone">Telefone</label>
              <Input id="profile-phone" type="tel" defaultValue="(11) 98765-4321" />
            </div>

            <div className="pt-2">
              <Button>Salvar dados do perfil</Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Escolha seu avatar"
          description="Use uma identidade visual mais marcante para deixar o painel com a sua cara."
        >
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-4">
            {avatarOptions.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                className="flex aspect-square items-center justify-center rounded-[1.2rem] border border-white/70 bg-white/62 text-3xl shadow-[0_18px_40px_-28px_rgba(73,47,22,0.32)] transition-transform duration-300 hover:-translate-y-0.5 hover:border-primary/35"
                title={avatar.label}
              >
                <span role="img" aria-label={avatar.label}>
                  {avatar.emoji}
                </span>
              </button>
            ))}

            <button
              type="button"
              className={cn(
                "flex aspect-square items-center justify-center rounded-[1.2rem] border text-white shadow-[0_22px_46px_-26px_rgba(31,109,104,0.8)] transition-transform duration-300 hover:-translate-y-0.5",
                "border-primary/15 bg-[linear-gradient(135deg,rgba(31,109,104,0.96),rgba(53,92,125,0.88))]",
              )}
              title="Avatar atual"
            >
              <User className="h-8 w-8" />
            </button>
          </div>

          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Clique em um avatar para definir sua foto de perfil no painel.
          </p>
        </SectionCard>
      </div>

      <SectionCard
        title="Seguranca"
        description="Atualize a senha quando precisar reforcar o acesso da conta e manter o painel protegido."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <label htmlFor="current-password">Senha atual</label>
            <Input id="current-password" type="password" placeholder="••••••••" />
          </div>
          <div className="grid gap-2">
            <label htmlFor="new-password">Nova senha</label>
            <Input id="new-password" type="password" placeholder="••••••••" />
          </div>
          <div className="grid gap-2">
            <label htmlFor="confirm-password">Confirmar nova senha</label>
            <Input id="confirm-password" type="password" placeholder="••••••••" />
          </div>
        </div>

        <div className="mt-5">
          <Button>
            <LockKeyhole className="h-4 w-4" />
            Alterar senha
          </Button>
        </div>
      </SectionCard>
    </PageShell>
  );
}
