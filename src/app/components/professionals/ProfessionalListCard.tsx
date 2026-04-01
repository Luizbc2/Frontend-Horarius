import { Mail, PencilLine, Phone, Trash2 } from "lucide-react";
import { Link } from "react-router";

import { formatPhone } from "../../data/clients";
import { getActiveWorkDaysCount, type Professional } from "../../data/professionals";
import { Button } from "../ui/button";

type ProfessionalListCardProps = {
  professional: Professional;
  onDelete: (professionalId: number) => void;
};

export function ProfessionalListCard({
  professional,
  onDelete,
}: ProfessionalListCardProps) {
  const activeWorkDays = getActiveWorkDaysCount(professional);

  return (
    <article className="rounded-[1.4rem] border border-white/70 bg-white/64 p-5 shadow-[0_20px_45px_-30px_rgba(73,47,22,0.32)]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl text-foreground">{professional.name}</h3>
        <span className="soft-badge" data-variant={professional.status === "ativo" ? "default" : "warm"}>
          {professional.status === "ativo" ? "Ativo" : "Férias"}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p>Especialidade: {professional.specialty}</p>
        <p>
          Horários: {activeWorkDays > 0 ? `${activeWorkDays} dia(s) ativo(s)` : "Ainda não configurados"}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="data-pill text-xs">
          <Mail className="h-3.5 w-3.5" />
          {professional.email}
        </span>
        <span className="data-pill text-xs">
          <Phone className="h-3.5 w-3.5" />
          {formatPhone(professional.phone)}
        </span>
      </div>

      <div className="mt-6 flex gap-2 border-t border-[rgba(74,52,34,0.08)] pt-4">
        <Button variant="outline" className="flex-1" asChild>
          <Link to={`/profissionais/${professional.id}/editar`}>
            <PencilLine className="h-4 w-4" />
            Editar
          </Link>
        </Button>
        <Button
          variant="outline"
          className="flex-1 text-destructive hover:text-destructive"
          onClick={() => onDelete(professional.id)}
        >
          <Trash2 className="h-4 w-4" />
          Excluir
        </Button>
      </div>
    </article>
  );
}
