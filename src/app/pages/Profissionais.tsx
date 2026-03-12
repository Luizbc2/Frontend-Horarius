import { Ban, Clock3, Edit, Phone, Plus, ShieldCheck, Trash2, Users } from "lucide-react";

import { MetricCard, PageShell, SectionCard } from "../components/PageShell";
import { Button } from "../components/ui/button";

type Professional = {
  id: number;
  name: string;
  avatar: string;
  specialties: string[];
  phone: string;
  status: "ativo" | "inativo";
};

const stats = [
  { label: "Profissionais", value: "1" },
  { label: "Em Atividade", value: "1" },
  { label: "Google Conectado", value: "Off", isToggle: true },
];


const professionals = [
  {
    id: 1,
    name: "Fodedor",
    avatar: "F",
    specialties: ["Corte", "Barba", "Pigmentação"],
    phone: "(11) 98765-4321",
    status: "ativo",
  },
] satisfies Professional[];

export function Profissionais() {
  const activeProfessionals = professionals.filter((professional) => professional.status === "ativo").length;

  return (
    <PageShell
      eyebrow="Gestao"
      title="Equipe e disponibilidade"
      description="Organize os profissionais da casa com uma apresentacao mais clara das especialidades, disponibilidade e atalhos operacionais."
      actions={
        <Button>
          <Plus className="h-4 w-4" />
          Novo profissional
        </Button>
      }
    >
      <div className="metric-grid">
        <MetricCard
          label="Profissionais"
          value={String(professionals.length)}
          helper="Pessoas cadastradas na equipe"
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          label="Em atividade"
          value={String(activeProfessionals)}
          helper="Disponiveis para agendamento"
          icon={<ShieldCheck className="h-5 w-5" />}
          accent="sand"
        />
        <MetricCard
          label="Google conectado"
          value="Off"
          helper="Ative para sincronizar horarios externos"
          icon={<Clock3 className="h-5 w-5" />}
          accent="coral"
        />
      </div>

      <SectionCard
        title="Equipe cadastrada"
        description="Cada card concentra as informacoes essenciais para editar cadastro, revisar agenda e aplicar bloqueios rapidamente."
      >
        {professionals.length > 0 ? (
          <div className="grid gap-4">
            {professionals.map((professional) => (
              <article
                key={professional.id}
                className="grid gap-5 rounded-[1.6rem] border border-white/70 bg-white/64 p-5 shadow-[0_22px_52px_-34px_rgba(73,47,22,0.34)] lg:grid-cols-[minmax(0,1fr)_15rem]"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start">
                  <div className="flex h-18 w-18 items-center justify-center rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(31,109,104,0.95),rgba(53,92,125,0.88))] text-3xl text-white shadow-[0_24px_48px_-26px_rgba(31,109,104,0.8)]">
                    {professional.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <h3 className="text-2xl text-foreground">{professional.name}</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {professional.specialties.map((specialty) => (
                            <span key={specialty} className="soft-badge" data-variant="warm">
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="soft-badge">
                        <span className="status-dot" />
                        {professional.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <div className="data-pill justify-between">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          Contato
                        </span>
                        <span className="text-sm font-medium text-foreground">{professional.phone}</span>
                      </div>
                      <div className="data-pill justify-between">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Clock3 className="h-4 w-4" />
                          Agenda
                        </span>
                        <span className="text-sm font-medium text-foreground">Disponivel</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <Button variant="outline" className="justify-start">
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Clock3 className="h-4 w-4" />
                    Horarios
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Ban className="h-4 w-4" />
                    Bloqueios
                  </Button>
                  <Button variant="outline" className="justify-start text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </SectionCard>
    </PageShell>
  );
}
