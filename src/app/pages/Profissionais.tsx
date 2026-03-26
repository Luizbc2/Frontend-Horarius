import { Clock3, Scissors, Sparkles, UserPlus } from "lucide-react";

import { MetricCard, PageShell, SectionCard } from "../components/PageShell";
import { Button } from "../components/ui/button";

type Professional = {
  id: number;
  name: string;
  specialty: string;
  shift: string;
  status: "ativo" | "férias";
};

const professionals = [
  {
    id: 1,
    name: "João",
    specialty: "Corte e barba",
    shift: "09:00 - 18:00",
    status: "ativo",
  },
  {
    id: 2,
    name: "Maria",
    specialty: "Coloração",
    shift: "10:00 - 19:00",
    status: "ativo",
  },
  {
    id: 3,
    name: "Rafael",
    specialty: "Pigmentação",
    shift: "08:00 - 17:00",
    status: "férias",
  },
] satisfies Professional[];

export function Profissionais() {
  const activeCount = professionals.filter((professional) => professional.status === "ativo").length;

  return (
    <PageShell
      eyebrow="Equipe"
      title="Profissionais"
      description="Organize especialidades, turnos e disponibilidade da equipe em um painel simples."
      actions={
        <Button>
          <UserPlus className="h-4 w-4" />
          Novo profissional
        </Button>
      }
    >
      <div className="metric-grid">
        <MetricCard
          label="Total na equipe"
          value={String(professionals.length)}
          helper="Profissionais cadastrados"
          icon={<Scissors className="h-5 w-5" />}
        />
        <MetricCard
          label="Ativos hoje"
          value={String(activeCount)}
          helper="Disponíveis para atendimento"
          icon={<Sparkles className="h-5 w-5" />}
          accent="sand"
        />
        <MetricCard
          label="Turno médio"
          value="9h"
          helper="Jornada por profissional"
          icon={<Clock3 className="h-5 w-5" />}
          accent="coral"
        />
      </div>

      <SectionCard
        title="Equipe cadastrada"
        description="Visualize rapidamente quem está ativo e quais especialidades estão disponíveis."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {professionals.map((professional) => (
            <article
              key={professional.id}
              className="rounded-[1.4rem] border border-white/70 bg-white/64 p-5 shadow-[0_20px_45px_-30px_rgba(73,47,22,0.32)]"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl text-foreground">{professional.name}</h3>
                <span className="soft-badge" data-variant={professional.status === "ativo" ? "default" : "warm"}>
                  {professional.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>Especialidade: {professional.specialty}</p>
                <p>Turno: {professional.shift}</p>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </PageShell>
  );
}
