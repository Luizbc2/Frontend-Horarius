import { Calendar, Search, Shapes, Users } from "lucide-react";

import { EmptyStatePanel, MetricCard, PageShell, SectionCard } from "../components/PageShell";
import { Input } from "../components/ui/input";

type ClientPlan = {
  id: number;
  client: string;
  plan: string;
  renewalDate: string;
};

export function PlanosClientes() {
  const plans: ClientPlan[] = [];

  return (
    <PageShell
      eyebrow="Gestao"
      title="Planos recorrentes de clientes"
      description="Deixe a area de recorrencia mais elegante para acompanhar renovacoes, volume mensal e oportunidades de fidelizacao."
    >
      <div className="metric-grid">
        <MetricCard
          label="Planos ativos"
          value="0"
          helper="Nenhum contrato recorrente no momento"
          icon={<Shapes className="h-5 w-5" />}
        />
        <MetricCard
          label="Clientes recorrentes"
          value="0"
          helper="Base fidelizada por assinatura"
          icon={<Users className="h-5 w-5" />}
          accent="sand"
        />
        <MetricCard
          label="Proxima renovacao"
          value="--"
          helper="Aparece assim que o primeiro plano entrar em vigor"
          icon={<Calendar className="h-5 w-5" />}
          accent="coral"
        />
      </div>

      <SectionCard
        title="Busca e acompanhamento"
        description="Procure um cliente ou nome de plano para acompanhar recorrencias sem abrir varias telas."
        action={
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar planos" className="pl-11" />
          </div>
        }
      >
        {plans.length === 0 ? (
          <EmptyStatePanel
            icon={<Calendar className="h-7 w-7" />}
            title="Nenhum plano recorrente"
            description="Quando voce estruturar pacotes recorrentes para clientes, esta area vai mostrar renovacoes, volume contratado e historico de permanencia."
          />
        ) : null}
      </SectionCard>
    </PageShell>
  );
}
