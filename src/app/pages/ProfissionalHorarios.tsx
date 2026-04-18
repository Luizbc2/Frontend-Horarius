import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Save,
  Trash2,
} from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router";

import { useAuth } from "../auth/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { ProfessionalWorkDayCard } from "../components/professionals/ProfessionalWorkDayCard";
import { PageShell, SectionCard } from "../components/PageShell";
import { Button } from "../components/ui/button";
import {
  getActiveWorkDaysCount,
  getProfessionalById,
  updateProfessionalWorkDays,
  validateProfessionalWorkDays,
  type ProfessionalWorkDay,
  type WeekDayKey,
} from "../data/professionals";
import {
  createExpandedBreakMap,
  createInitialWorkDays,
  createProfessionalSnapshot,
  getProfessionalInitials,
  mapWorkDaysFromApi,
} from "../features/professionals/work-day-helpers";
import { getApiErrorMessage } from "../lib/api-error";
import { createProfessionalsService, type ProfessionalApiItem } from "../services/professionals";

export function ProfissionalHorarios() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const professionalId = params.professionalId ? Number(params.professionalId) : null;
  const cachedProfessional = useMemo(
    () => (professionalId === null || !user ? null : getProfessionalById(user.id, professionalId)),
    [professionalId, user],
  );
  const initialWorkDays = createInitialWorkDays(cachedProfessional);
  const [professional, setProfessional] = useState<ProfessionalApiItem | null>(
    createProfessionalSnapshot(cachedProfessional),
  );
  const [workDays, setWorkDays] = useState<ProfessionalWorkDay[]>(() => initialWorkDays);
  const [expandedBreaks, setExpandedBreaks] = useState<Record<WeekDayKey, boolean>>(() =>
    createExpandedBreakMap(initialWorkDays),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  if (professionalId === null) {
    return <Navigate to="/profissionais" replace />;
  }

  useEffect(() => {
    if (!token || !user) {
      setIsLoading(false);
      setErrorMessage("Sua sessão expirou. Entre novamente para continuar.");
      return;
    }

    let isMounted = true;

    const loadWorkDays = async () => {
      try {
        const professionalsService = createProfessionalsService(token);
        const [professionalResponse, workDaysResponse] = await Promise.all([
          professionalsService.getById(professionalId),
          professionalsService.listWorkDays(professionalId),
        ]);

        if (!isMounted) {
          return;
        }

        setProfessional(professionalResponse.professional);
        setWorkDays(mapWorkDaysFromApi(workDaysResponse.data));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          getApiErrorMessage(error, "Não foi possível carregar os dados do profissional."),
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadWorkDays();

    return () => {
      isMounted = false;
    };
  }, [professionalId, token, user]);

  if (!professional && !isLoading) {
    return <Navigate to="/profissionais" replace />;
  }

  const activeDaysCount = getActiveWorkDaysCount({ workDays });
  const professionalName = professional?.name ?? "Profissional";

  const updateWorkDay = (day: WeekDayKey, updater: (current: ProfessionalWorkDay) => ProfessionalWorkDay) => {
    setErrorMessage(null);
    setWorkDays((currentWorkDays) =>
      currentWorkDays.map((workDay) => (workDay.day === day ? updater(workDay) : workDay)),
    );
  };

  const toggleBreakSection = (day: WeekDayKey) => {
    setExpandedBreaks((current) => ({
      ...current,
      [day]: !current[day],
    }));
  };

  const handleClear = () => {
    setErrorMessage(null);
    setWorkDays((currentWorkDays) =>
      currentWorkDays.map((workDay) => ({
        ...workDay,
        enabled: false,
        startTime: "09:00",
        endTime: "18:00",
        breakStart: "",
        breakEnd: "",
      })),
    );
  };

  const handleSave = async () => {
    const validationMessage = validateProfessionalWorkDays(workDays);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    if (!token || !user) {
      setErrorMessage("Sua sessão expirou. Entre novamente para continuar.");
      return;
    }

    setIsSaving(true);

    try {
      if (!professional) {
        setErrorMessage("Profissional não encontrado.");
        setIsSaving(false);
        return;
      }

      const professionalsService = createProfessionalsService(token);
      const response = await professionalsService.updateWorkDays(
        professional.id,
        workDays.map((workDay) => ({
          dayOfWeek: workDay.day,
          enabled: workDay.enabled,
          startTime: workDay.startTime,
          endTime: workDay.endTime,
          breakStart: workDay.breakStart || null,
          breakEnd: workDay.breakEnd || null,
        })),
      );

      updateProfessionalWorkDays(user.id, professional.id, mapWorkDaysFromApi(response.workDays));

      navigate("/profissionais", {
        replace: true,
        state: { notice: response.message },
      });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Não foi possível salvar os horários do profissional."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageShell
      eyebrow="Profissionais"
      title="Horários de trabalho"
      description="Defina os dias e faixas de atendimento do profissional para a semana. Se quiser, também dá para registrar pausa no mesmo dia."
      actions={
        <Button variant="outline" asChild>
          <Link to="/profissionais">
            <ArrowLeft className="h-4 w-4" />
            Voltar para profissionais
          </Link>
        </Button>
      }
    >
      <SectionCard className="overflow-hidden p-0" contentClassName="mt-0">
        <div className="rounded-[1.8rem] bg-[linear-gradient(135deg,#274f4b,#4f8e84)] p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-semibold">
                {getProfessionalInitials(professionalName)}
              </div>
              <div>
                <p className="text-2xl font-semibold">{professionalName}</p>
                <p className="text-base text-white/85">Rotina semanal de atendimento</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em]">
              <CalendarDays className="h-4 w-4" />
              {activeDaysCount} dia(s) ativos
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          {errorMessage ? (
            <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
              <AlertTitle>Revise os horários</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          {isLoading ? (
            <div className="rounded-[1.6rem] border border-[rgba(74,52,34,0.12)] bg-white/88 p-6 text-sm text-muted-foreground">
              Carregando horários do profissional...
            </div>
          ) : null}

          {!isLoading
            ? workDays.map((workDay) => (
                <ProfessionalWorkDayCard
                  key={workDay.day}
                  workDay={workDay}
                  isBreakOpen={expandedBreaks[workDay.day] ?? false}
                  onToggleBreak={toggleBreakSection}
                  onUpdate={updateWorkDay}
                />
              ))
            : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(74,52,34,0.08)] bg-white/75 px-6 py-5">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={handleClear}
          >
            <Trash2 className="h-4 w-4" />
            Limpar
          </Button>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" asChild>
              <Link to="/profissionais">Cancelar</Link>
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={isSaving || isLoading}>
              <Save className="h-4 w-4" />
              {isSaving ? "Salvando..." : "Salvar horários"}
            </Button>
          </div>
        </div>
      </SectionCard>
    </PageShell>
  );
}
