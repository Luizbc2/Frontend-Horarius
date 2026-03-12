import { Clock3, DollarSign, Edit, Plus, Sparkles, Ticket, Trash2 } from "lucide-react";

import { EmptyStatePanel, MetricCard, PageShell, SectionCard } from "../components/PageShell";
import { Button } from "../components/ui/button";

type Service = {
  id: number;
  name: string;
  duration: string;
  price: string;
  category: string;
};

const stats = [
  { label: "Serviços Ativos", value: "5" },
  { label: "Ticket Médio", value: "R$ 31,00" },
  { label: "Estado", value: "Organizado" },
];

const services = [
  {
    id: 1,
    name: "Corte Simples",
    duration: "20 MIN",
    price: "R$ 25,00",
    category: "Corte",
  },
  {
    id: 2,
    name: "Corte + Barba",
    duration: "40 MIN",
    price: "R$ 45,00",
    category: "Combo",
  },
  {
    id: 3,
    name: "Barba",
    duration: "20 MIN",
    price: "R$ 20,00",
    category: "Barba",
  },
  {
    id: 4,
    name: "Pigmentação",
    duration: "30 MIN",
    price: "R$ 35,00",
    category: "Especializado",
  },
  {
    id: 5,
    name: "Sobrancelha",
    duration: "15 MIN",
    price: "R$ 30,00",
    category: "Estética",
  },
] satisfies Service[];

export function Servicos() {
  return (
    <PageShell
      eyebrow="Gestao"
      title="Catalogo de servicos"
      description="Transforme o catalogo em uma vitrine mais elegante, com leitura rapida de categorias, duracao e preco medio por atendimento."
      actions={
        <Button>
          <Plus className="h-4 w-4" />
          Novo servico
        </Button>
      }
    >
      <div className="metric-grid">
        <MetricCard
          label={stats[0].label}
          value={stats[0].value}
          helper="Servicos ativos no catalogo"
          icon={<Sparkles className="h-5 w-5" />}
        />
        <MetricCard
          label={stats[1].label}
          value={stats[1].value}
          helper="Faixa media de faturamento por atendimento"
          icon={<Ticket className="h-5 w-5" />}
          accent="sand"
        />
        <MetricCard
          label={stats[2].label}
          value={stats[2].value}
          helper="Estrutura pronta para vender melhor"
          icon={<Clock3 className="h-5 w-5" />}
          accent="coral"
        />
      </div>

      <SectionCard
        title="Servicos cadastrados"
        description="Cards mais refinados ajudam a comparar categorias, entender ticket medio e ajustar o portfolio com menos esforco visual."
      >
        {services.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.id}
                className="group rounded-[1.6rem] border border-white/70 bg-white/64 p-5 shadow-[0_22px_52px_-34px_rgba(73,47,22,0.34)] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="soft-badge" data-variant="warm">
                    {service.category}
                  </span>
                  <span className="data-pill text-xs uppercase tracking-[0.18em]">
                    {service.duration}
                  </span>
                </div>

                <h3 className="mt-5 text-2xl text-foreground">{service.name}</h3>

                <div className="mt-6 space-y-3">
                  <div className="data-pill justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Clock3 className="h-4 w-4" />
                      Duracao
                    </span>
                    <span className="font-medium text-foreground">{service.duration}</span>
                  </div>
                  <div className="data-pill justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Preco
                    </span>
                    <span className="text-lg font-semibold text-foreground">{service.price}</span>
                  </div>
                </div>

                <div className="mt-6 flex gap-2 border-t border-[rgba(74,52,34,0.08)] pt-4">
                  <Button variant="outline" className="flex-1">
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="outline" className="flex-1 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyStatePanel
            icon={<Plus className="h-7 w-7" />}
            title="Nenhum servico cadastrado"
            description="Adicione servicos para apresentar melhor seu catalogo, criar combinacoes e aumentar o ticket medio com mais clareza."
            action={
              <Button>
                <Plus className="h-4 w-4" />
                Adicionar servico
              </Button>
            }
          />
        )}
      </SectionCard>
    </PageShell>
  );
}
