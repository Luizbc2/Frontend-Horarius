import { CircleAlert, Clock3, Mail, PencilLine, Phone, Trash2 } from "lucide-react";
import { Link } from "react-router";

import { formatPhone } from "../../data/clients";
import {
  getActiveWorkDaysCount,
  getActiveWorkDaysSummary,
  type Professional,
} from "../../data/professionals";
import { Button } from "../ui/button";

type ProfessionalListCardProps = {
  professional: Professional;
  onDelete: (professionalId: number) => void;
};

const MAX_NAME_LENGTH = 26;
const MAX_SPECIALTY_LENGTH = 72;
const MAX_DAYS_SUMMARY_LENGTH = 44;

function truncateText(value: string, maxLength: number) {
  const normalizedValue = value.trim();

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, maxLength - 1).trimEnd()}...`;
}

export function ProfessionalListCard({
  professional,
  onDelete,
}: ProfessionalListCardProps) {
  const activeWorkDays = getActiveWorkDaysCount(professional);
  const activeDaysSummary = getActiveWorkDaysSummary(professional);
  const hasSchedule = activeWorkDays > 0;
  const operationalStatus = hasSchedule ? "Liberado para agenda" : "Horarios pendentes";
  const displayName = truncateText(professional.name || "Profissional sem nome", MAX_NAME_LENGTH);
  const displaySpecialty = truncateText(
    professional.specialty || "Especialidade nao informada",
    MAX_SPECIALTY_LENGTH,
  );
  const displayPhone = professional.phone ? formatPhone(professional.phone) : "Telefone nao informado";
  const displayEmail = professional.email || "E-mail nao informado";

  return (
    <article className="flex h-full flex-col rounded-[1.8rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,248,242,0.88))] p-6 shadow-[0_28px_60px_-34px_rgba(73,47,22,0.35)]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-start gap-3">
          <h3 className="max-w-full text-[2rem] font-semibold leading-none text-foreground" title={professional.name}>
            {displayName}
          </h3>
          <span className="inline-flex items-center rounded-full border border-[rgba(74,52,34,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
            {professional.status === "ativo" ? "Ativo" : "Ferias"}
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
              hasSchedule
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-600"
            }`}
          >
            <Clock3 className="mr-1.5 h-3.5 w-3.5" />
            {hasSchedule ? `${activeWorkDays} dia(s) ativos` : "Sem horarios"}
          </span>
        </div>

        <div className="space-y-3 text-base text-muted-foreground">
          <p title={professional.specialty}>{displaySpecialty}</p>
          <p title={professional.specialty}>Área de atuacao: {displaySpecialty}</p>
        </div>

        {hasSchedule ? (
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/70 px-5 py-4 text-emerald-700">
            <p className="text-base leading-7">
              A rotina de atendimento ja foi definida e esse profissional pode aparecer normalmente na agenda.
            </p>
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50/80 px-5 py-4 text-rose-600">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-base leading-7">
                Esse profissional ainda nao entra na agenda online porque a rotina de atendimento dele nao foi
                definida.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3 text-base text-muted-foreground">
          <p>{displayPhone}</p>
          <p>Dias ativos: {activeWorkDays}</p>
          <p>Status operacional: {operationalStatus}</p>
          <p className="text-sm leading-6" title={activeDaysSummary}>
            {truncateText(activeDaysSummary, MAX_DAYS_SUMMARY_LENGTH)}
          </p>

          <div className="space-y-2 pt-1">
            <div className="rounded-[1rem] border border-[rgba(74,52,34,0.08)] bg-white/64 px-3 py-2">
              <div className="flex items-start gap-2 text-xs text-foreground">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 break-all leading-5" title={displayEmail}>
                  {displayEmail}
                </span>
              </div>
            </div>

            <div className="rounded-[1rem] border border-[rgba(74,52,34,0.08)] bg-white/64 px-3 py-2">
              <div className="flex items-start gap-2 text-xs text-foreground">
                <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 break-words leading-5" title={displayPhone}>
                  {displayPhone}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 border-t border-[rgba(74,52,34,0.08)] pt-5">
        <Button variant="outline" className="min-w-[8.5rem] flex-1 md:flex-none" asChild>
          <Link to={`/profissionais/${professional.id}/editar`} state={{ professional }}>
            <PencilLine className="h-4 w-4" />
            Editar
          </Link>
        </Button>
        <Button variant="outline" className="min-w-[8.5rem] flex-1 md:flex-none" asChild>
          <Link to={`/profissionais/${professional.id}/horarios`}>
            <Clock3 className="h-4 w-4" />
            Horarios
          </Link>
        </Button>
        <Button
          variant="outline"
          className="min-w-[8.5rem] flex-1 text-destructive hover:text-destructive md:flex-none"
          onClick={() => onDelete(professional.id)}
        >
          <Trash2 className="h-4 w-4" />
          Remover
        </Button>
      </div>
    </article>
  );
}


