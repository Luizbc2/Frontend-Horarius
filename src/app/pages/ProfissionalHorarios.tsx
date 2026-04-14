import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  Coffee,
  Save,
  Trash2,
} from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router";

import { useAuth } from "../auth/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { PageShell, SectionCard } from "../components/PageShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import {
  createDefaultWorkDays,
  getActiveWorkDaysCount,
  getProfessionalById,
  updateProfessionalWorkDays,
  validateProfessionalWorkDays,
  WEEK_DAYS,
  WEEK_DAY_LABELS,
  type ProfessionalWorkDay,
  type WeekDayKey,
} from "../data/professionals";
import { getApiErrorMessage } from "../lib/api-error";
import { createProfessionalsService } from "../services/professionals";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfissionalHorarios() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const professionalId = params.professionalId ? Number(params.professionalId) : null;
  const professional = useMemo(
    () => (professionalId === null ? null : getProfessionalById(professionalId)),
    [professionalId],
  );

  const [workDays, setWorkDays] = useState<ProfessionalWorkDay[]>(() => professional?.workDays ?? createDefaultWorkDays());
  const [expandedBreaks, setExpandedBreaks] = useState<Record<WeekDayKey, boolean>>(() =>
    Object.fromEntries((professional?.workDays ?? createDefaultWorkDays()).map((workDay) => [workDay.day, false])) as Record<
      WeekDayKey,
      boolean
    >,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  if (professionalId === null || !professional) {
    return <Navigate to="/profissionais" replace />;
  }

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setErrorMessage("Sua sessao expirou. Entre novamente para continuar.");
      return;
    }

    let isMounted = true;

    const loadWorkDays = async () => {
      try {
        const response = await createProfessionalsService(token).listWorkDays(professional.id);

        if (!isMounted) {
          return;
        }

        setWorkDays(mapWorkDaysFromApi(response.data));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(getApiErrorMessage(error, "Nao foi possivel carregar os horarios do profissional."));
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
  }, [professional.id, token]);

  const activeDaysCount = getActiveWorkDaysCount({ workDays });

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

    if (!token) {
      setErrorMessage("Sua sessao expirou. Entre novamente para continuar.");
      return;
    }

    setIsSaving(true);

    try {
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

      updateProfessionalWorkDays(professional.id, mapWorkDaysFromApi(response.workDays));

      navigate("/profissionais", {
        replace: true,
        state: { notice: response.message },
      });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Nao foi possivel salvar os horarios do profissional."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageShell
      eyebrow="Profissionais"
      title="Horarios de trabalho"
      description="Defina os dias e faixas de atendimento do profissional para a semana. Se quiser, tambem da para registrar pausa no mesmo dia."
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
                {getInitials(professional.name)}
              </div>
              <div>
                <p className="text-2xl font-semibold">{professional.name}</p>
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
              <AlertTitle>Revise os horarios</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          {isLoading ? (
            <div className="rounded-[1.6rem] border border-[rgba(74,52,34,0.12)] bg-white/88 p-6 text-sm text-muted-foreground">
              Carregando horarios do profissional...
            </div>
          ) : null}

          {!isLoading
            ? workDays.map((workDay) => {
            const isBreakOpen = expandedBreaks[workDay.day] ?? false;

            return (
              <div
                key={workDay.day}
                className="rounded-[1.6rem] border border-[rgba(74,52,34,0.12)] bg-white/88 p-5 shadow-[0_16px_40px_-30px_rgba(73,47,22,0.3)]"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                  <div className="flex min-w-[10rem] items-center gap-4">
                    <span className="h-10 w-1 rounded-full bg-primary/80" />
                    <p className="text-2xl font-semibold text-foreground">{WEEK_DAY_LABELS[workDay.day]}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={workDay.enabled}
                      onCheckedChange={(checked) =>
                        updateWorkDay(workDay.day, (current) => ({
                          ...current,
                          enabled: checked,
                        }))
                      }
                      className="h-9 w-14"
                    />
                  </div>

                  <div className="grid flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] md:items-center">
                    <div className="relative">
                      <Input
                        type="time"
                        value={workDay.startTime}
                        onChange={(event) =>
                          updateWorkDay(workDay.day, (current) => ({
                            ...current,
                            startTime: event.target.value,
                          }))
                        }
                        disabled={!workDay.enabled}
                        className="h-14 rounded-full pr-11 text-lg"
                      />
                      <Clock3 className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>

                    <div className="flex items-center justify-center text-muted-foreground">
                      <ArrowRight className="h-5 w-5" />
                    </div>

                    <div className="relative">
                      <Input
                        type="time"
                        value={workDay.endTime}
                        onChange={(event) =>
                          updateWorkDay(workDay.day, (current) => ({
                            ...current,
                            endTime: event.target.value,
                          }))
                        }
                        disabled={!workDay.enabled}
                        className="h-14 rounded-full pr-11 text-lg"
                      />
                      <Clock3 className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-14 w-14 rounded-full"
                      onClick={() => toggleBreakSection(workDay.day)}
                    >
                      <Coffee className="h-4 w-4" />
                      <span className="sr-only">Ajustar pausa em {WEEK_DAY_LABELS[workDay.day]}</span>
                      {isBreakOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {isBreakOpen ? (
                  <div className="mt-5 border-t border-[rgba(74,52,34,0.12)] pt-5">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,8rem)] md:items-center">
                      <div className="flex items-center gap-2 text-base text-muted-foreground">
                        <Coffee className="h-4 w-4" />
                        Pausa
                      </div>

                      <div className="relative">
                        <Input
                          type="time"
                          value={workDay.breakStart}
                          onChange={(event) =>
                            updateWorkDay(workDay.day, (current) => ({
                              ...current,
                              breakStart: event.target.value,
                            }))
                          }
                          disabled={!workDay.enabled}
                          className="h-14 rounded-full pr-11 text-lg"
                        />
                        <Clock3 className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>

                      <div className="flex items-center justify-center text-muted-foreground">
                        <ArrowRight className="h-5 w-5" />
                      </div>

                      <div className="relative">
                        <Input
                          type="time"
                          value={workDay.breakEnd}
                          onChange={(event) =>
                            updateWorkDay(workDay.day, (current) => ({
                              ...current,
                              breakEnd: event.target.value,
                            }))
                          }
                          disabled={!workDay.enabled}
                          className="h-14 rounded-full pr-11 text-lg"
                        />
                        <Clock3 className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>

                      <p className="text-sm text-muted-foreground">Opcional</p>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
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
              {isSaving ? "Salvando..." : "Salvar horarios"}
            </Button>
          </div>
        </div>
      </SectionCard>
    </PageShell>
  );
}

function mapWorkDaysFromApi(
  workDays: Array<{
    dayOfWeek: string;
    enabled: boolean;
    startTime: string;
    endTime: string;
    breakStart: string | null;
    breakEnd: string | null;
  }>,
): ProfessionalWorkDay[] {
  const workDaysByKey = new Map(
    workDays.map((workDay) => [
      workDay.dayOfWeek,
      {
        day: workDay.dayOfWeek as WeekDayKey,
        enabled: workDay.enabled,
        startTime: workDay.startTime || "09:00",
        endTime: workDay.endTime || "18:00",
        breakStart: workDay.breakStart ?? "",
        breakEnd: workDay.breakEnd ?? "",
      },
    ]),
  );

  return WEEK_DAYS.map(
    (day) =>
      workDaysByKey.get(day) ?? {
        day,
        enabled: false,
        startTime: "09:00",
        endTime: "18:00",
        breakStart: "",
        breakEnd: "",
      },
  );
}
