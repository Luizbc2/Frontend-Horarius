import { useEffect, useState, type FormEvent } from "react";
import { Ban, Clock3, Edit, Phone, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import { Toaster, toast } from "sonner";

import { EmptyStatePanel, MetricCard, PageShell, SectionCard } from "../components/PageShell";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";

const STORAGE_KEY = "horarius:profissionais";

const WEEKDAYS = [
  { key: "segunda", label: "Segunda-feira", shortLabel: "Seg" },
  { key: "terca", label: "Terca-feira", shortLabel: "Ter" },
  { key: "quarta", label: "Quarta-feira", shortLabel: "Qua" },
  { key: "quinta", label: "Quinta-feira", shortLabel: "Qui" },
  { key: "sexta", label: "Sexta-feira", shortLabel: "Sex" },
  { key: "sabado", label: "Sabado", shortLabel: "Sab" },
  { key: "domingo", label: "Domingo", shortLabel: "Dom" },
] as const;

type WeekdayKey = (typeof WEEKDAYS)[number]["key"];

type ScheduleSlot = {
  day: WeekdayKey;
  enabled: boolean;
  start: string;
  end: string;
};

type Professional = {
  id: number;
  name: string;
  avatar: string;
  specialties: string[];
  phone: string;
  schedule: ScheduleSlot[];
  legacySchedule?: string;
  status: "ativo" | "inativo";
  notes: string;
};

type ProfessionalFormData = {
  name: string;
  phone: string;
  specialties: string;
  schedule: ScheduleSlot[];
  notes: string;
};

type ProfessionalFormErrors = {
  name?: string;
  phone?: string;
  specialties?: string;
  schedule?: string;
};

const defaultWorkingDays: WeekdayKey[] = ["segunda", "terca", "quarta", "quinta", "sexta"];

function createSchedule(activeDays: WeekdayKey[] = defaultWorkingDays, start = "09:00", end = "18:00"): ScheduleSlot[] {
  return WEEKDAYS.map(({ key }) => ({
    day: key,
    enabled: activeDays.includes(key),
    start,
    end,
  }));
}

const initialFormData: ProfessionalFormData = {
  name: "",
  phone: "",
  specialties: "",
  schedule: createSchedule(),
  notes: "",
};

const defaultProfessionals = [
  {
    id: 1,
    name: "Joao",
    avatar: "J",
    specialties: ["Corte", "Barba", "Pigmentacao"],
    phone: "11987654321",
    schedule: createSchedule(["segunda", "terca", "quarta", "quinta", "sexta", "sabado"], "09:00", "19:00"),
    status: "ativo",
    notes: "Atende cortes classicos, barba completa e finalizacao rapida.",
  },
] satisfies Professional[];

function cloneSchedule(schedule: ScheduleSlot[]) {
  return schedule.map((slot) => ({ ...slot }));
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function formatPhone(value: string) {
  const digits = normalizePhone(value);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function parseSpecialties(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[,;\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function buildAvatar(name: string) {
  const trimmedName = name.trim();
  return trimmedName ? trimmedName.charAt(0).toUpperCase() : "?";
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeTime(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value) ? value : fallback;
}

function getWeekdayMeta(day: WeekdayKey) {
  return WEEKDAYS.find((weekday) => weekday.key === day) ?? WEEKDAYS[0];
}

function getWeekdayIndex(day: WeekdayKey) {
  return WEEKDAYS.findIndex((weekday) => weekday.key === day);
}

function normalizeStoredSchedule(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  return WEEKDAYS.map(({ key }) => {
    const matchingSlot = value.find((slot) => {
      if (!slot || typeof slot !== "object" || !("day" in slot)) {
        return false;
      }

      return (slot as { day?: unknown }).day === key;
    }) as Partial<ScheduleSlot> | undefined;

    return {
      day: key,
      enabled: Boolean(matchingSlot?.enabled),
      start: normalizeTime(matchingSlot?.start, "09:00"),
      end: normalizeTime(matchingSlot?.end, "18:00"),
    };
  });
}

function resolveWeekdayToken(token: string) {
  const normalizedToken = normalizeText(token);

  const aliasMap: Record<string, WeekdayKey> = {
    seg: "segunda",
    segunda: "segunda",
    ter: "terca",
    terca: "terca",
    qua: "quarta",
    quarta: "quarta",
    qui: "quinta",
    quinta: "quinta",
    sex: "sexta",
    sexta: "sexta",
    sab: "sabado",
    sabado: "sabado",
    dom: "domingo",
    domingo: "domingo",
  };

  return aliasMap[normalizedToken] ?? null;
}

function applyScheduleRange(schedule: ScheduleSlot[], startDay: WeekdayKey, endDay: WeekdayKey, start: string, end: string) {
  const startIndex = getWeekdayIndex(startDay);
  const endIndex = getWeekdayIndex(endDay);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return false;
  }

  for (let index = startIndex; index <= endIndex; index += 1) {
    schedule[index] = {
      ...schedule[index],
      enabled: true,
      start,
      end,
    };
  }

  return true;
}

function parseLegacySchedule(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const schedule = createSchedule([]);
  let matched = false;

  const segments = trimmedValue
    .split("|")
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (const segment of segments) {
    const rangeMatch = segment.match(
      /^([A-Za-z\u00C0-\u017F]+)\s+a\s+([A-Za-z\u00C0-\u017F]+),?\s*(\d{2}:\d{2})\s*(?:as|a|-)\s*(\d{2}:\d{2})$/i,
    );

    if (rangeMatch) {
      const startDay = resolveWeekdayToken(rangeMatch[1]);
      const endDay = resolveWeekdayToken(rangeMatch[2]);

      if (startDay && endDay && applyScheduleRange(schedule, startDay, endDay, rangeMatch[3], rangeMatch[4])) {
        matched = true;
        continue;
      }
    }

    const singleDayMatch = segment.match(
      /^([A-Za-z\u00C0-\u017F]+),?\s*(\d{2}:\d{2})\s*(?:as|a|-)\s*(\d{2}:\d{2})$/i,
    );

    if (singleDayMatch) {
      const day = resolveWeekdayToken(singleDayMatch[1]);

      if (day && applyScheduleRange(schedule, day, day, singleDayMatch[2], singleDayMatch[3])) {
        matched = true;
      }
    }
  }

  return matched ? schedule : null;
}

function normalizeProfessional(value: unknown, index: number): Professional | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<Professional> & { legacySchedule?: unknown };
  const storedSchedule = normalizeStoredSchedule(candidate.schedule);
  const parsedLegacySchedule =
    typeof candidate.schedule === "string" ? parseLegacySchedule(candidate.schedule) : null;
  const legacySchedule =
    typeof candidate.legacySchedule === "string"
      ? candidate.legacySchedule.trim()
      : typeof candidate.schedule === "string" && !parsedLegacySchedule
        ? candidate.schedule.trim()
        : "";

  return {
    id: typeof candidate.id === "number" ? candidate.id : Date.now() + index,
    name: typeof candidate.name === "string" ? candidate.name : `Profissional ${index + 1}`,
    avatar:
      typeof candidate.avatar === "string" && candidate.avatar.trim()
        ? candidate.avatar
        : buildAvatar(typeof candidate.name === "string" ? candidate.name : ""),
    specialties: Array.isArray(candidate.specialties)
      ? candidate.specialties.filter((specialty): specialty is string => typeof specialty === "string" && specialty.trim().length > 0)
      : [],
    phone: typeof candidate.phone === "string" ? normalizePhone(candidate.phone) : "",
    schedule: storedSchedule ?? parsedLegacySchedule ?? createSchedule([]),
    legacySchedule,
    status: candidate.status === "inativo" ? "inativo" : "ativo",
    notes: typeof candidate.notes === "string" ? candidate.notes : "",
  };
}

function loadProfessionals(): Professional[] {
  if (typeof window === "undefined") {
    return defaultProfessionals;
  }

  try {
    const storedProfessionals = window.localStorage.getItem(STORAGE_KEY);

    if (!storedProfessionals) {
      return defaultProfessionals;
    }

    const parsedProfessionals = JSON.parse(storedProfessionals) as unknown[];

    if (!Array.isArray(parsedProfessionals)) {
      return defaultProfessionals;
    }

    const normalizedProfessionals = parsedProfessionals
      .map((professional, index) => normalizeProfessional(professional, index))
      .filter((professional): professional is Professional => professional !== null);

    return normalizedProfessionals.length > 0 ? normalizedProfessionals : defaultProfessionals;
  } catch {
    return defaultProfessionals;
  }
}

function validateField(field: "name" | "phone" | "specialties", value: string) {
  const trimmedValue = value.trim();

  if (field === "name" && !trimmedValue) {
    return "Informe o nome do profissional.";
  }

  if (field === "phone" && trimmedValue) {
    const digits = normalizePhone(trimmedValue);

    if (digits.length < 10) {
      return "Digite um telefone valido com 10 ou 11 numeros.";
    }
  }

  if (field === "specialties" && parseSpecialties(value).length === 0) {
    return "Adicione pelo menos uma especialidade.";
  }

  return "";
}

function validateSchedule(schedule: ScheduleSlot[]) {
  const activeSlots = schedule.filter((slot) => slot.enabled);

  if (activeSlots.length === 0) {
    return "";
  }

  if (activeSlots.some((slot) => !slot.start || !slot.end)) {
    return "Defina horario inicial e final para cada dia ativo.";
  }

  if (activeSlots.some((slot) => slot.start >= slot.end)) {
    return "O horario final precisa ser maior que o inicial.";
  }

  return "";
}

function validateFormData(formData: ProfessionalFormData) {
  const errors: ProfessionalFormErrors = {};

  const nameError = validateField("name", formData.name);
  const phoneError = validateField("phone", formData.phone);
  const specialtiesError = validateField("specialties", formData.specialties);
  const scheduleError = validateSchedule(formData.schedule);

  if (nameError) {
    errors.name = nameError;
  }

  if (phoneError) {
    errors.phone = phoneError;
  }

  if (specialtiesError) {
    errors.specialties = specialtiesError;
  }

  if (scheduleError) {
    errors.schedule = scheduleError;
  }

  return errors;
}

function summarizeSchedule(schedule: ScheduleSlot[], legacySchedule?: string) {
  const activeSlots = schedule.filter((slot) => slot.enabled);

  if (activeSlots.length === 0) {
    return legacySchedule?.trim() || "Nao informado";
  }

  const groups: Array<{ startIndex: number; endIndex: number; start: string; end: string }> = [];

  activeSlots.forEach((slot) => {
    const dayIndex = getWeekdayIndex(slot.day);
    const lastGroup = groups[groups.length - 1];

    if (
      lastGroup &&
      lastGroup.endIndex + 1 === dayIndex &&
      lastGroup.start === slot.start &&
      lastGroup.end === slot.end
    ) {
      lastGroup.endIndex = dayIndex;
      return;
    }

    groups.push({
      startIndex: dayIndex,
      endIndex: dayIndex,
      start: slot.start,
      end: slot.end,
    });
  });

  return groups
    .map((group) => {
      const startLabel = WEEKDAYS[group.startIndex]?.shortLabel ?? "";
      const endLabel = WEEKDAYS[group.endIndex]?.shortLabel ?? "";
      const timeLabel = `${group.start} as ${group.end}`;

      return group.startIndex === group.endIndex
        ? `${startLabel}, ${timeLabel}`
        : `${startLabel} a ${endLabel}, ${timeLabel}`;
    })
    .join(" | ");
}

function scheduleSummaryLines(schedule: ScheduleSlot[], legacySchedule?: string) {
  return summarizeSchedule(schedule, legacySchedule)
    .split("|")
    .map((line) => line.trim())
    .filter(Boolean);
}

type ScheduleEditorProps = {
  schedule: ScheduleSlot[];
  onToggleDay: (day: WeekdayKey, enabled: boolean) => void;
  onTimeChange: (day: WeekdayKey, field: "start" | "end", value: string) => void;
  inputIdPrefix: string;
  error?: string;
};

function ScheduleEditor({ schedule, onToggleDay, onTimeChange, inputIdPrefix, error }: ScheduleEditorProps) {
  return (
    <div className="grid gap-3">
      {schedule.map((slot) => {
        const weekday = getWeekdayMeta(slot.day);

        return (
          <div
            key={slot.day}
            className="grid gap-3 rounded-[1.2rem] border border-white/70 bg-white/60 p-4 shadow-[0_18px_44px_-30px_rgba(70,47,28,0.28)] md:grid-cols-[minmax(0,1fr)_10rem_10rem]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{weekday.label}</p>
                <p className="text-xs text-muted-foreground">
                  {slot.enabled ? "Disponivel para agendamento" : "Sem atendimento neste dia"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {slot.enabled ? "Ativo" : "Pausa"}
                </span>
                <Switch checked={slot.enabled} onCheckedChange={(checked) => onToggleDay(slot.day, checked)} />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor={`${inputIdPrefix}-${slot.day}-start`} className="text-xs text-muted-foreground">
                Inicio
              </label>
              <Input
                id={`${inputIdPrefix}-${slot.day}-start`}
                type="time"
                value={slot.start}
                disabled={!slot.enabled}
                onChange={(event) => onTimeChange(slot.day, "start", event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor={`${inputIdPrefix}-${slot.day}-end`} className="text-xs text-muted-foreground">
                Fim
              </label>
              <Input
                id={`${inputIdPrefix}-${slot.day}-end`}
                type="time"
                value={slot.end}
                disabled={!slot.enabled}
                onChange={(event) => onTimeChange(slot.day, "end", event.target.value)}
              />
            </div>
          </div>
        );
      })}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function Profissionais() {
  const [professionals, setProfessionals] = useState<Professional[]>(loadProfessionals);
  const [formData, setFormData] = useState<ProfessionalFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<ProfessionalFormErrors>({});
  const [editingProfessionalId, setEditingProfessionalId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleSlot[]>(createSchedule([]));
  const [scheduleDraftError, setScheduleDraftError] = useState("");
  const [scheduleProfessionalId, setScheduleProfessionalId] = useState<number | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(professionals));
  }, [professionals]);

  const activeProfessionals = professionals.filter((professional) => professional.status === "ativo").length;
  const uniqueSpecialties = new Set(professionals.flatMap((professional) => professional.specialties)).size;

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      schedule: cloneSchedule(initialFormData.schedule),
    });
    setFormErrors({});
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProfessionalId(null);
    resetForm();
  };

  const openCreateForm = () => {
    setEditingProfessionalId(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditForm = (professional: Professional) => {
    setEditingProfessionalId(professional.id);
    setFormData({
      name: professional.name,
      phone: professional.phone,
      specialties: professional.specialties.join(", "),
      schedule: cloneSchedule(professional.schedule),
      notes: professional.notes,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const clearForm = () => {
    setEditingProfessionalId(null);
    resetForm();
  };

  const closeScheduleDialog = () => {
    setScheduleDialogOpen(false);
    setScheduleProfessionalId(null);
    setScheduleDraft(createSchedule([]));
    setScheduleDraftError("");
  };

  const openScheduleForm = (professional: Professional) => {
    setScheduleProfessionalId(professional.id);
    setScheduleDraft(cloneSchedule(professional.schedule));
    setScheduleDraftError("");
    setScheduleDialogOpen(true);
  };

  const handleChange = (field: "name" | "phone" | "specialties" | "notes", value: string) => {
    const nextValue = field === "phone" ? normalizePhone(value) : value;

    setFormData((currentData) => ({
      ...currentData,
      [field]: nextValue,
    }));

    if (field === "name" || field === "phone" || field === "specialties") {
      setFormErrors((currentErrors) => ({
        ...currentErrors,
        [field]: validateField(field, nextValue),
      }));
    }
  };

  const updateSchedule = (
    currentSchedule: ScheduleSlot[],
    day: WeekdayKey,
    update: Partial<Pick<ScheduleSlot, "enabled" | "start" | "end">>,
  ) =>
    currentSchedule.map((slot) =>
      slot.day === day
        ? {
            ...slot,
            ...update,
          }
        : slot,
    );

  const handleFormScheduleToggle = (day: WeekdayKey, enabled: boolean) => {
    setFormData((currentData) => {
      const nextSchedule = updateSchedule(currentData.schedule, day, { enabled });

      setFormErrors((currentErrors) => ({
        ...currentErrors,
        schedule: validateSchedule(nextSchedule),
      }));

      return {
        ...currentData,
        schedule: nextSchedule,
      };
    });
  };

  const handleFormScheduleTimeChange = (day: WeekdayKey, field: "start" | "end", value: string) => {
    setFormData((currentData) => {
      const nextSchedule = updateSchedule(currentData.schedule, day, { [field]: value });

      setFormErrors((currentErrors) => ({
        ...currentErrors,
        schedule: validateSchedule(nextSchedule),
      }));

      return {
        ...currentData,
        schedule: nextSchedule,
      };
    });
  };

  const handleScheduleDraftToggle = (day: WeekdayKey, enabled: boolean) => {
    setScheduleDraft((currentDraft) => {
      const nextDraft = updateSchedule(currentDraft, day, { enabled });
      setScheduleDraftError(validateSchedule(nextDraft));
      return nextDraft;
    });
  };

  const handleScheduleDraftTimeChange = (day: WeekdayKey, field: "start" | "end", value: string) => {
    setScheduleDraft((currentDraft) => {
      const nextDraft = updateSchedule(currentDraft, day, { [field]: value });
      setScheduleDraftError(validateSchedule(nextDraft));
      return nextDraft;
    });
  };

  const handleCreateOrUpdateProfessional = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateFormData(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Revise os campos invalidos antes de salvar.");
      return;
    }

    const trimmedName = formData.name.trim();
    const parsedSpecialties = parseSpecialties(formData.specialties);
    const normalizedSchedule = cloneSchedule(formData.schedule);

    if (editingProfessionalId !== null) {
      setProfessionals((currentProfessionals) =>
        currentProfessionals.map((professional) =>
          professional.id === editingProfessionalId
            ? {
                ...professional,
                name: trimmedName,
                avatar: buildAvatar(trimmedName),
                phone: formData.phone.trim(),
                specialties: parsedSpecialties,
                schedule: normalizedSchedule,
                legacySchedule: "",
                notes: formData.notes.trim(),
              }
            : professional,
        ),
      );

      closeDialog();
      toast.success("Profissional atualizado com sucesso!");
      return;
    }

    const newProfessional: Professional = {
      id: Date.now(),
      name: trimmedName,
      avatar: buildAvatar(trimmedName),
      phone: formData.phone.trim(),
      specialties: parsedSpecialties,
      schedule: normalizedSchedule,
      status: "ativo",
      notes: formData.notes.trim(),
    };

    setProfessionals((currentProfessionals) => [newProfessional, ...currentProfessionals]);
    closeDialog();
    toast.success("Profissional cadastrado com sucesso!");
  };

  const handleDeleteProfessional = (professionalId: number) => {
    setProfessionals((currentProfessionals) =>
      currentProfessionals.filter((professional) => professional.id !== professionalId),
    );

    if (editingProfessionalId === professionalId) {
      closeDialog();
    }

    if (scheduleProfessionalId === professionalId) {
      closeScheduleDialog();
    }

    toast.success("Profissional removido com sucesso!");
  };

  const handleSaveSchedule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (scheduleProfessionalId === null) {
      closeScheduleDialog();
      return;
    }

    const validationError = validateSchedule(scheduleDraft);
    setScheduleDraftError(validationError);

    if (validationError) {
      toast.error("Revise os horarios antes de salvar.");
      return;
    }

    setProfessionals((currentProfessionals) =>
      currentProfessionals.map((professional) =>
        professional.id === scheduleProfessionalId
          ? {
              ...professional,
              schedule: cloneSchedule(scheduleDraft),
              legacySchedule: "",
            }
          : professional,
      ),
    );

    closeScheduleDialog();
    toast.success("Horarios atualizados com sucesso!");
  };

  const previewSpecialties = parseSpecialties(formData.specialties);
  const previewScheduleLines = scheduleSummaryLines(formData.schedule);

  return (
    <>
      <PageShell
        eyebrow="Gestao"
        title="Equipe e disponibilidade"
        description="Organize os profissionais da casa com uma apresentacao mais clara das especialidades, disponibilidade e atalhos operacionais."
        actions={
          <Button type="button" onClick={openCreateForm}>
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
            label="Especialidades"
            value={String(uniqueSpecialties)}
            helper="Servicos cobertos pela equipe atual"
            icon={<Clock3 className="h-5 w-5" />}
            accent="coral"
          />
        </div>

        <SectionCard
          title="Equipe cadastrada"
          description="Cada card concentra as informacoes essenciais para editar cadastro, revisar agenda e aplicar bloqueios rapidamente."
        >
          {professionals.length === 0 ? (
            <EmptyStatePanel
              icon={<Users className="h-7 w-7" />}
              title="Nenhum profissional cadastrado"
              description="Adicione o primeiro profissional para organizar especialidades, contato e operacao da agenda em um unico lugar."
              action={
                <Button type="button" onClick={openCreateForm}>
                  <Plus className="h-4 w-4" />
                  Adicionar profissional
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4">
              {professionals.map((professional) => {
                const scheduleLines = scheduleSummaryLines(professional.schedule, professional.legacySchedule);

                return (
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

                        {professional.notes ? (
                          <p className="mt-4 text-sm leading-6 text-muted-foreground">{professional.notes}</p>
                        ) : null}

                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                          <div className="data-pill justify-between">
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              Contato
                            </span>
                            <span className="text-sm font-medium text-foreground">
                              {professional.phone ? formatPhone(professional.phone) : "Nao informado"}
                            </span>
                          </div>
                          <div className="data-pill items-start justify-between gap-3">
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Clock3 className="h-4 w-4" />
                              Agenda
                            </span>
                            <span className="flex flex-col items-end text-right text-sm font-medium text-foreground">
                              {scheduleLines.map((line) => (
                                <span key={`${professional.id}-${line}`}>{line}</span>
                              ))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                      <Button type="button" variant="outline" className="justify-start" onClick={() => openEditForm(professional)}>
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="justify-start"
                        onClick={() => openScheduleForm(professional)}
                      >
                        <Clock3 className="h-4 w-4" />
                        Horarios
                      </Button>
                      <Button type="button" variant="outline" className="justify-start">
                        <Ban className="h-4 w-4" />
                        Bloqueios
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="justify-start text-destructive hover:text-destructive"
                        onClick={() => handleDeleteProfessional(professional.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </SectionCard>
      </PageShell>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="rounded-[1.75rem] border-white/70 bg-[linear-gradient(180deg,rgba(255,251,246,0.97),rgba(248,241,231,0.94))] p-6 shadow-[0_30px_80px_-38px_rgba(73,47,22,0.34)] sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-foreground">
              {editingProfessionalId === null ? "Novo profissional" : "Editar profissional"}
            </DialogTitle>
            <DialogDescription className="leading-6">
              {editingProfessionalId === null
                ? "Cadastre os dados do profissional com dias de atendimento e horario por faixa."
                : "Atualize o cadastro do profissional localmente enquanto a tela ainda opera sem back-end."}
            </DialogDescription>
          </DialogHeader>

          <form
            noValidate
            onSubmit={handleCreateOrUpdateProfessional}
            className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]"
          >
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="professional-name">Nome</label>
                <Input
                  id="professional-name"
                  value={formData.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  aria-invalid={Boolean(formErrors.name)}
                  placeholder="Ex.: Carlos Souza"
                />
                {formErrors.name ? <p className="text-sm text-destructive">{formErrors.name}</p> : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <label htmlFor="professional-phone">Telefone</label>
                  <Input
                    id="professional-phone"
                    type="text"
                    value={formatPhone(formData.phone)}
                    onChange={(event) => handleChange("phone", event.target.value)}
                    aria-invalid={Boolean(formErrors.phone)}
                    placeholder="11999999999"
                    inputMode="numeric"
                  />
                  {formErrors.phone ? (
                    <p className="text-sm text-destructive">{formErrors.phone}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Use 10 ou 11 numeros com DDD.</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <label htmlFor="professional-specialties">Especialidades</label>
                  <Input
                    id="professional-specialties"
                    value={formData.specialties}
                    onChange={(event) => handleChange("specialties", event.target.value)}
                    aria-invalid={Boolean(formErrors.specialties)}
                    placeholder="Corte, Barba, Sobrancelha"
                  />
                  {formErrors.specialties ? (
                    <p className="text-sm text-destructive">{formErrors.specialties}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Separe as especialidades por virgula.</p>
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                <div>
                  <label className="block">Horarios de atendimento</label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ative apenas os dias em que esse profissional pode receber agendamentos.
                  </p>
                </div>
                <ScheduleEditor
                  schedule={formData.schedule}
                  onToggleDay={handleFormScheduleToggle}
                  onTimeChange={handleFormScheduleTimeChange}
                  inputIdPrefix="professional-schedule"
                  error={formErrors.schedule}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="professional-notes">Observacoes</label>
                <Textarea
                  id="professional-notes"
                  value={formData.notes}
                  onChange={(event) => handleChange("notes", event.target.value)}
                  placeholder="Ex.: atende melhor no periodo da tarde e faz acabamento premium."
                  rows={5}
                  className="rounded-[1rem] border-white/70 bg-input-background px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_18px_44px_-28px_rgba(70,47,28,0.32)]"
                />
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/70 bg-white/58 p-5 shadow-[0_22px_52px_-34px_rgba(73,47,22,0.34)]">
              <span className="soft-badge" data-variant="warm">
                Preview do cadastro
              </span>

              <div className="mt-5 flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(135deg,rgba(31,109,104,0.95),rgba(53,92,125,0.88))] text-2xl text-white shadow-[0_24px_48px_-26px_rgba(31,109,104,0.8)]">
                  {buildAvatar(formData.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl text-foreground">{formData.name.trim() || "Novo profissional"}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {formData.notes.trim() || "Adicione observacoes para descrever a forma de atendimento ou diferencas de agenda."}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {(previewSpecialties.length > 0 ? previewSpecialties : ["Especialidades ainda nao informadas"]).map((specialty) => (
                  <span key={specialty} className="soft-badge" data-variant="warm">
                    {specialty}
                  </span>
                ))}
              </div>

              <div className="mt-5 grid gap-3">
                <div className="data-pill justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    Contato
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {formData.phone ? formatPhone(formData.phone) : "Nao informado"}
                  </span>
                </div>
                <div className="data-pill items-start justify-between gap-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    Horarios
                  </span>
                  <span className="flex flex-col items-end text-right text-sm font-medium text-foreground">
                    {(previewScheduleLines.length > 0 ? previewScheduleLines : ["Nao informado"]).map((line) => (
                      <span key={`preview-${line}`}>{line}</span>
                    ))}
                  </span>
                </div>
                <div className="data-pill justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    Status inicial
                  </span>
                  <span className="text-sm font-medium text-foreground">Ativo</span>
                </div>
              </div>
            </div>

            <DialogFooter className="xl:col-span-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="button" variant="outline" onClick={clearForm}>
                Limpar formulario
              </Button>
              <Button type="submit">
                <Plus className="h-4 w-4" />
                {editingProfessionalId === null ? "Salvar profissional" : "Salvar alteracoes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleDialogOpen} onOpenChange={(open) => (open ? setScheduleDialogOpen(true) : closeScheduleDialog())}>
        <DialogContent className="rounded-[1.75rem] border-white/70 bg-[linear-gradient(180deg,rgba(255,251,246,0.97),rgba(248,241,231,0.94))] p-6 shadow-[0_30px_80px_-38px_rgba(73,47,22,0.34)] sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-foreground">Horarios do profissional</DialogTitle>
            <DialogDescription className="leading-6">
              Ajuste os dias da semana e o horario de atendimento desse profissional.
            </DialogDescription>
          </DialogHeader>

          <form noValidate onSubmit={handleSaveSchedule} className="grid gap-5">
            <ScheduleEditor
              schedule={scheduleDraft}
              onToggleDay={handleScheduleDraftToggle}
              onTimeChange={handleScheduleDraftTimeChange}
              inputIdPrefix="professional-schedule-dialog"
              error={scheduleDraftError}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeScheduleDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                <Clock3 className="h-4 w-4" />
                Salvar horarios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Toaster position="bottom-left" closeButton richColors />
    </>
  );
}
