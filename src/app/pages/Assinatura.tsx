import { Check, X } from "lucide-react";
import { useState } from "react";

import { MetricCard, PageShell, SectionCard } from "../components/PageShell";
import { Button } from "../components/ui/button";
import { cn } from "../components/ui/utils";

type Plan = {
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  description: string;
  popular?: boolean;
  features: Array<{ text: string; included: boolean }>;
};

const plans = [
  {
    name: "Starter",
    monthlyPrice: "R$ 49",
    annualPrice: "R$ 490",
    description: "Para começar",
    features: [
      { text: "1 profissional", included: true },
      { text: "Agenda básica", included: true },
      { text: "100 agendamentos/mês", included: true },
      { text: "Relatórios básicos", included: true },
      { text: "WhatsApp integrado", included: false },
      { text: "Google Calendar", included: false },
      { text: "Múltiplas unidades", included: false },
    ],
  },
  {
    name: "Pro",
    monthlyPrice: "R$ 99",
    annualPrice: "R$ 990",
    description: "Mais popular",
    popular: true,
    features: [
      { text: "Até 5 profissionais", included: true },
      { text: "Agenda completa", included: true },
      { text: "Agendamentos ilimitados", included: true },
      { text: "Relatórios avançados", included: true },
      { text: "WhatsApp integrado", included: true },
      { text: "Google Calendar", included: true },
      { text: "Múltiplas unidades", included: false },
    ],
  },
  {
    name: "Business",
    monthlyPrice: "R$ 199",
    annualPrice: "R$ 1.990",
    description: "Para crescer",
    features: [
      { text: "Profissionais ilimitados", included: true },
      { text: "Agenda completa", included: true },
      { text: "Agendamentos ilimitados", included: true },
      { text: "Relatórios avançados", included: true },
      { text: "WhatsApp integrado", included: true },
      { text: "Google Calendar", included: true },
      { text: "Múltiplas unidades", included: true },
    ],
  },
] satisfies Plan[];

export function Assinatura() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  return (
    <PageShell
      eyebrow="Crescimento"
      title="Planos e assinatura"
      description="Apresente a oferta com mais clareza, destaque o plano ideal para cada momento do negócio e deixe a comparação mais elegante."
      actions={<span className="data-pill">14 dias de teste grátis</span>}
    >
      <div className="metric-grid">
        <MetricCard
          label="Planos disponíveis"
          value={String(plans.length)}
          helper="Estrutura pronta para escalar o negócio"
          accent="default"
        />
        <MetricCard
          label="Economia anual"
          value="17%"
          helper="Desconto visível para incentivar permanência"
          accent="sand"
        />
        <MetricCard
          label="Período de teste"
          value="14 dias"
          helper="Entrada leve para novos assinantes"
          accent="coral"
        />
      </div>

      <SectionCard
        title="Escolha o ritmo de cobrança"
        description="Alterne entre mensal e anual para mostrar o valor percebido de cada plano sem poluir a leitura da página."
        action={
          <div className="inline-flex rounded-[1.1rem] border border-white/70 bg-white/70 p-1 shadow-[0_18px_45px_-28px_rgba(73,47,22,0.24)]">
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={cn(
                "rounded-[0.9rem] px-4 py-2 text-sm font-semibold transition-colors",
                billingPeriod === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod("annual")}
              className={cn(
                "rounded-[0.9rem] px-4 py-2 text-sm font-semibold transition-colors",
                billingPeriod === "annual"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Anual
            </button>
          </div>
        }
      >
        <div className="grid gap-4 xl:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                "relative overflow-hidden rounded-[1.7rem] border p-6 shadow-[0_24px_58px_-36px_rgba(73,47,22,0.34)] transition-transform duration-300 hover:-translate-y-1",
                plan.popular
                  ? "border-primary/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(233,247,245,0.78))]"
                  : "border-white/70 bg-white/64",
              )}
            >
              {plan.popular ? (
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="soft-badge">Mais popular</span>
                  {billingPeriod === "annual" ? (
                    <span className="soft-badge" data-variant="warm">
                      -17% anual
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-4">
                <div>
                  <h3 className="text-3xl text-foreground">{plan.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                <div>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl tracking-[-0.05em] text-foreground">
                      {billingPeriod === "monthly" ? plan.monthlyPrice : plan.annualPrice}
                    </span>
                    <span className="pb-1 text-sm uppercase tracking-[0.2em] text-muted-foreground">
                      /{billingPeriod === "monthly" ? "mês" : "ano"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {billingPeriod === "monthly"
                      ? "Pagamento flexível, ideal para começar."
                      : "Melhor custo para manter o crescimento previsível."}
                  </p>
                </div>

                <Button variant={plan.popular ? "default" : "outline"} className="w-full">
                  Escolher plano
                </Button>
              </div>

              <div className="mt-6 border-t border-[rgba(74,52,34,0.08)] pt-5">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-3 text-sm">
                      {feature.included ? (
                        <Check className="mt-0.5 h-4.5 w-4.5 flex-shrink-0 text-primary" />
                      ) : (
                        <X className="mt-0.5 h-4.5 w-4.5 flex-shrink-0 text-muted-foreground/55" />
                      )}
                      <span className={feature.included ? "text-foreground" : "text-muted-foreground"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Perguntas frequentes"
        description="Respostas diretas deixam a decisão de compra mais leve e evitam atrito antes da assinatura."
      >
        <div className="grid gap-3">
          <div className="rounded-[1.4rem] border border-white/70 bg-white/60 p-5">
            <h3 className="text-lg text-foreground">Posso mudar de plano a qualquer momento?</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Sim. Upgrade e downgrade podem ser feitos sempre que sua operação pedir outra estrutura.
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-white/70 bg-white/60 p-5">
            <h3 className="text-lg text-foreground">Como funciona o período de teste?</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Todos os planos começam com 14 dias grátis, sem necessidade de cartão para testar o fluxo principal.
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-white/70 bg-white/60 p-5">
            <h3 className="text-lg text-foreground">Posso cancelar a qualquer momento?</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Sim. O cancelamento pode ser feito a qualquer momento, sem multa contratual.
            </p>
          </div>
        </div>
      </SectionCard>
    </PageShell>
  );
}
