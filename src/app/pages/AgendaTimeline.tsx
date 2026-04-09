import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Toaster, toast } from "sonner";
import {
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MoreVertical,
  Pencil,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/button";
import { EmptyStatePanel, MetricCard, PageShell, SectionCard } from "../components/PageShell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { cn } from "../components/ui/utils";
import { getApiErrorMessage } from "../lib/api-error";
import { loadProfessionals, type Professional } from "../data/professionals";
import { createAppointmentsService } from "../services/appointments";

type AppointmentStatus = "confirmado" | "pendente" | "cancelado";

type Appointment = {
  id: number;
  clientId: number;
  time: string;
  client: string;
  serviceId: number;
  service: string;
  professionalId: string;
  status: AppointmentStatus;
  notes: string;
};

type AppointmentDraft = {
  client: string;
  service: string;
  time: string;
  professionalId: string;
  status: AppointmentStatus;
};

const DAY_START_HOUR = 9;
const DAY_END_HOUR = 19;
const SLOT_INTERVAL_MINUTES = 10;
const SLOT_HEIGHT = 34;
const APPOINTMENT_DURATION_IN_MINUTES = 30;

const statusStyles: Record<
  AppointmentStatus,
  { card: string; badge: string; label: string }
> = {
  confirmado: {
    card: "border-emerald-300 bg-emerald-100/90",
    badge: "border-emerald-300 bg-emerald-50 text-emerald-800",
    label: "Confirmado",
  },
  pendente: {
    card: "border-amber-300 bg-amber-100/90",
    badge: "border-amber-300 bg-amber-50 text-amber-800",
    label: "Pendente",
  },
  cancelado: {
    card: "border-rose-300 bg-rose-100/90",
    badge: "border-rose-300 bg-rose-50 text-rose-700",
    label: "Cancelado",
  },
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function padTime(value: number) {
  return String(value).padStart(2, "0");
}

function generateTimeSlots() {
  const slots: string[] = [];
  const totalMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;

  for (let minutes = 0; minutes < totalMinutes; minutes += SLOT_INTERVAL_MINUTES) {
    const hour = DAY_START_HOUR + Math.floor(minutes / 60);
    const minute = minutes % 60;
    slots.push(`${padTime(hour)}:${padTime(minute)}`);
  }

  return slots;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatDateForApi(date: Date) {
  const year = date.getFullYear();
  const month = padTime(date.getMonth() + 1);
  const day = padTime(date.getDate());

  return `${year}-${month}-${day}`;
}

function formatAppointmentTime(scheduledAt: string) {
  return new Date(scheduledAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function buildScheduledAt(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const scheduledDate = new Date(date);

  scheduledDate.setHours(hours, minutes, 0, 0);

  return scheduledDate.toISOString();
}

export function AgendaTimeline() {
  const { token } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date("2026-04-01T10:00:00"));
  const [selectedProfessional, setSelectedProfessional] = useState("todos");
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [draggedAppointmentId, setDraggedAppointmentId] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [appointmentDraft, setAppointmentDraft] = useState<AppointmentDraft>({
    client: "",
    service: "",
    time: "09:00",
    professionalId: "",
    status: "confirmado",
  });

  useEffect(() => {
    setProfessionals(loadProfessionals());
  }, []);

  useEffect(() => {
    if (!token) {
      setAppointments([]);
      return;
    }

    let isMounted = true;

    const loadAppointments = async () => {
      setIsLoadingAppointments(true);

      try {
        const appointmentsService = createAppointmentsService(token);
        const response = await appointmentsService.list({
          date: formatDateForApi(selectedDate),
          limit: 200,
          page: 1,
        });

        if (!isMounted) {
          return;
        }

        setAppointments(
          response.data.map((appointment) => ({
            id: appointment.id,
            clientId: appointment.clientId,
            time: formatAppointmentTime(appointment.scheduledAt),
            client: appointment.clientName,
            serviceId: appointment.serviceId,
            service: appointment.serviceName,
            professionalId: String(appointment.professionalId),
            status: appointment.status,
            notes: appointment.notes,
          })),
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setAppointments([]);
        toast.error(getApiErrorMessage(error, "Nao foi possivel carregar os agendamentos."));
      } finally {
        if (isMounted) {
          setIsLoadingAppointments(false);
        }
      }
    };

    void loadAppointments();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, token, refreshKey]);

  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const timelineHeight = timeSlots.length * SLOT_HEIGHT;

  const visibleProfessionals = useMemo(() => {
    if (selectedProfessional === "todos") {
      return professionals;
    }

    return professionals.filter((professional) => String(professional.id) === selectedProfessional);
  }, [professionals, selectedProfessional]);

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        if (selectedProfessional !== "todos" && appointment.professionalId !== selectedProfessional) {
          return false;
        }

        if (selectedStatus !== "todos" && appointment.status !== selectedStatus) {
          return false;
        }

        return true;
      }),
    [appointments, selectedProfessional, selectedStatus],
  );

  const appointmentsByProfessional = useMemo(() => {
    const grouped = new Map<string, Appointment[]>();

    for (const professional of visibleProfessionals) {
      grouped.set(String(professional.id), []);
    }

    for (const appointment of filteredAppointments) {
      if (!grouped.has(appointment.professionalId)) {
        continue;
      }

      grouped.get(appointment.professionalId)?.push(appointment);
    }

    for (const appointmentList of grouped.values()) {
      appointmentList.sort((left, right) => timeToMinutes(left.time) - timeToMinutes(right.time));
    }

    return grouped;
  }, [filteredAppointments, visibleProfessionals]);

  const confirmedCount = filteredAppointments.filter((appointment) => appointment.status === "confirmado").length;
  const pendingCount = filteredAppointments.filter((appointment) => appointment.status === "pendente").length;
  const occupancyBase = visibleProfessionals.length * timeSlots.length;
  const occupancy = occupancyBase > 0 ? Math.round((filteredAppointments.length / occupancyBase) * 100) : 0;

  const formatTitleDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

  const previousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const today = () => {
    setSelectedDate(new Date());
  };

  const resetEditDialog = () => {
    setEditingAppointmentId(null);
    setAppointmentDraft({
      client: "",
      service: "",
      time: "09:00",
      professionalId: "",
      status: "confirmado",
    });
  };

  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointmentId(appointment.id);
    setAppointmentDraft({
      client: appointment.client,
      service: appointment.service,
      time: appointment.time,
      professionalId: appointment.professionalId,
      status: appointment.status,
    });
  };

  const handleDeleteAppointment = (appointmentId: number) => {
    if (!token) {
      toast.error("Sua sessao expirou. Entre novamente para continuar.");
      return;
    }

    const appointmentsService = createAppointmentsService(token);

    void appointmentsService
      .remove(appointmentId)
      .then((response) => {
        setAppointments((currentAppointments) =>
          currentAppointments.filter((appointment) => appointment.id !== appointmentId),
        );
        toast.success(response.message);
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Nao foi possivel excluir o agendamento."));
      });
  };

  const handleDropAppointment = (professionalId: string, time: string) => {
    if (draggedAppointmentId === null) {
      return;
    }

    if (!token) {
      toast.error("Sua sessao expirou. Entre novamente para continuar.");
      setDraggedAppointmentId(null);
      setDragOverSlot(null);
      return;
    }

    const draggedAppointment = appointments.find((appointment) => appointment.id === draggedAppointmentId);

    if (!draggedAppointment) {
      setDraggedAppointmentId(null);
      setDragOverSlot(null);
      return;
    }

    const targetAppointment = appointments.find(
      (appointment) =>
        appointment.id !== draggedAppointmentId &&
        appointment.professionalId === professionalId &&
        appointment.time === time,
    );

    if (targetAppointment) {
      const previousAppointments = appointments;
      const nextAppointments = appointments.map((appointment) => {
        if (appointment.id === draggedAppointmentId) {
          return {
            ...appointment,
            professionalId: targetAppointment.professionalId,
            time: targetAppointment.time,
          };
        }

        if (appointment.id === targetAppointment.id) {
          return {
            ...appointment,
            professionalId: draggedAppointment.professionalId,
            time: draggedAppointment.time,
          };
        }

        return appointment;
      });

      setAppointments(nextAppointments);

      const appointmentsService = createAppointmentsService(token);

      void Promise.all([
        appointmentsService.update(draggedAppointment.id, {
          clientId: draggedAppointment.clientId,
          professionalId: Number(targetAppointment.professionalId),
          serviceId: draggedAppointment.serviceId,
          scheduledAt: buildScheduledAt(selectedDate, targetAppointment.time),
          status: draggedAppointment.status,
          notes: draggedAppointment.notes,
        }),
        appointmentsService.update(targetAppointment.id, {
          clientId: targetAppointment.clientId,
          professionalId: Number(draggedAppointment.professionalId),
          serviceId: targetAppointment.serviceId,
          scheduledAt: buildScheduledAt(selectedDate, draggedAppointment.time),
          status: targetAppointment.status,
          notes: targetAppointment.notes,
        }),
      ]).catch((error) => {
        setAppointments(previousAppointments);
        toast.error(getApiErrorMessage(error, "Nao foi possivel trocar os agendamentos."));
      });

      setDraggedAppointmentId(null);
      setDragOverSlot(null);
      return;
    }

    const targetStart = timeToMinutes(time);
    const targetEnd = targetStart + APPOINTMENT_DURATION_IN_MINUTES;
    const hasConflict = appointments.some((appointment) => {
      if (appointment.id === draggedAppointmentId || appointment.professionalId !== professionalId) {
        return false;
      }

      const appointmentStart = timeToMinutes(appointment.time);
      const appointmentEnd = appointmentStart + APPOINTMENT_DURATION_IN_MINUTES;

      return targetStart < appointmentEnd && targetEnd > appointmentStart;
    });

    if (hasConflict) {
      toast.error("Esse horário já está ocupado para esse profissional.");
      setDraggedAppointmentId(null);
      setDragOverSlot(null);
      return;
    }

    const previousAppointments = appointments;
    const nextAppointments = appointments.map((appointment) =>
      appointment.id === draggedAppointmentId
        ? {
            ...appointment,
            professionalId,
            time,
          }
        : appointment,
    );

    setAppointments(nextAppointments);

    const appointmentsService = createAppointmentsService(token);

    void appointmentsService
      .update(draggedAppointment.id, {
        clientId: draggedAppointment.clientId,
        professionalId: Number(professionalId),
        serviceId: draggedAppointment.serviceId,
        scheduledAt: buildScheduledAt(selectedDate, time),
        status: draggedAppointment.status,
        notes: draggedAppointment.notes,
      })
      .catch((error) => {
        setAppointments(previousAppointments);
        toast.error(getApiErrorMessage(error, "Nao foi possivel mover o agendamento."));
      });

    setDraggedAppointmentId(null);
    setDragOverSlot(null);
  };

  const handleSaveAppointmentEdit = () => {
    if (editingAppointmentId === null) {
      return;
    }

    if (!token) {
      toast.error("Sua sessao expirou. Entre novamente para continuar.");
      return;
    }

    const normalizedClient = appointmentDraft.client.trim();
    const normalizedService = appointmentDraft.service.trim();

    if (!normalizedClient || !normalizedService) {
      toast.error("Preencha cliente e servico.");
      return;
    }

    const conflict = appointments.find(
      (appointment) =>
        appointment.id !== editingAppointmentId &&
        appointment.professionalId === appointmentDraft.professionalId &&
        appointment.time === appointmentDraft.time,
    );

    if (conflict) {
      toast.error("Ja existe um agendamento nesse horario.");
      return;
    }

    const currentAppointment = appointments.find((appointment) => appointment.id === editingAppointmentId);

    if (!currentAppointment) {
      toast.error("Agendamento nao encontrado.");
      return;
    }

    const previousAppointments = appointments;
    const nextAppointments = appointments.map((appointment) =>
      appointment.id === editingAppointmentId
        ? {
            ...appointment,
            client: normalizedClient,
            service: normalizedService,
            time: appointmentDraft.time,
            professionalId: appointmentDraft.professionalId,
            status: appointmentDraft.status,
          }
        : appointment,
    );

    setAppointments(nextAppointments);
    resetEditDialog();

    const appointmentsService = createAppointmentsService(token);

    void appointmentsService
      .update(editingAppointmentId, {
        clientId: currentAppointment.clientId,
        professionalId: Number(appointmentDraft.professionalId),
        serviceId: currentAppointment.serviceId,
        scheduledAt: buildScheduledAt(selectedDate, appointmentDraft.time),
        status: appointmentDraft.status,
        notes: currentAppointment.notes,
      })
      .then((response) => {
        setAppointments((currentAppointments) =>
          currentAppointments.map((appointment) =>
            appointment.id === editingAppointmentId
              ? {
                  ...appointment,
                  client: response.appointment.clientName,
                  service: response.appointment.serviceName,
                  time: formatAppointmentTime(response.appointment.scheduledAt),
                  professionalId: String(response.appointment.professionalId),
                  status: response.appointment.status,
                  notes: response.appointment.notes,
                }
              : appointment,
          ),
        );
        toast.success(response.message);
      })
      .catch((error) => {
        setAppointments(previousAppointments);
        toast.error(getApiErrorMessage(error, "Nao foi possivel atualizar o agendamento."));
      });
  };

  return (
    <PageShell
      eyebrow="Agenda"
      title="Timeline do dia"
      description="Visualize os horários lado a lado por profissional e acompanhe os encaixes do dia com mais clareza."
      actions={
        <>
          <Button variant="outline" onClick={() => setRefreshKey((currentKey) => currentKey + 1)}>
            <RefreshCw className="h-4 w-4" />
            Recarregar
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/agenda/lista">Ver lista completa</Link>
          </Button>
        </>
      }
    >
      <div className="metric-grid">
        <MetricCard
          label="Atendimentos do dia"
          value={String(filteredAppointments.length)}
          helper="Blocos ocupados na timeline atual."
          icon={<CalendarCheck2 className="h-5 w-5" />}
        />
        <MetricCard
          label="Confirmados"
          value={String(confirmedCount)}
          helper="Clientes já confirmados."
          icon={<Users className="h-5 w-5" />}
          accent="sand"
        />
        <MetricCard
          label="Ocupação"
          value={`${occupancy}%`}
          helper={`${pendingCount} pendente${pendingCount === 1 ? "" : "s"} no momento.`}
          icon={<Clock3 className="h-5 w-5" />}
          accent="coral"
        />
      </div>

      <SectionCard
        title="Controles da agenda"
        description="Troque o dia, filtre por profissional e mantenha a leitura do quadro bem objetiva."
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="icon" onClick={previousDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={today}>
                <CalendarDays className="h-4 w-4" />
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={nextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-center">
              <p className="text-3xl text-foreground capitalize">{formatTitleDate(selectedDate)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{selectedDate.toLocaleDateString("pt-BR")}</p>
            </div>

            <Button variant="outline" onClick={() => setRefreshKey((currentKey) => currentKey + 1)}>
              <RefreshCw className="h-4 w-4" />
              Recarregar
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-base text-foreground">Barbeiros:</span>
            <Button
              variant={selectedProfessional === "todos" ? "default" : "outline"}
              onClick={() => setSelectedProfessional("todos")}
            >
              Todos
            </Button>
            {professionals.map((professional) => (
              <Button
                key={professional.id}
                variant={selectedProfessional === String(professional.id) ? "default" : "outline"}
                onClick={() => setSelectedProfessional(String(professional.id))}
              >
                {professional.name}
              </Button>
            ))}

            <span className="ml-2 text-base text-foreground">Status:</span>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Grade da agenda"
        description="Cada coluna representa um profissional e os cartões entram na altura exata do horário agendado."
      >
        {professionals.length === 0 ? (
          <EmptyStatePanel
            icon={<Users className="h-7 w-7" />}
            title="Nenhum profissional disponível"
            description="Cadastre pelo menos um profissional para montar a timeline da agenda com colunas reais."
          />
        ) : isLoadingAppointments ? (
          <EmptyStatePanel
            icon={<RefreshCw className="h-7 w-7" />}
            title="Carregando agenda"
            description="Estamos buscando os agendamentos do dia para montar a timeline."
          />
        ) : visibleProfessionals.length === 0 ? (
          <EmptyStatePanel
            icon={<Clock3 className="h-7 w-7" />}
            title="Nenhum profissional nesse filtro"
            description="Ajuste o filtro de barbeiros para voltar a exibir as colunas da agenda."
          />
        ) : (
          <div className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/52 shadow-[0_24px_55px_-34px_rgba(73,47,22,0.28)]">
            <div className="overflow-x-auto">
              <div
                className="min-w-[980px]"
                style={{
                  display: "grid",
                  gridTemplateColumns: `100px repeat(${visibleProfessionals.length}, minmax(320px, 1fr))`,
                }}
              >
                <div className="border-b border-r border-[rgba(74,52,34,0.08)] bg-white/70 px-4 py-4 text-sm font-medium text-foreground">
                  Hora
                </div>

                {visibleProfessionals.map((professional) => (
                  <div
                    key={professional.id}
                    className="border-b border-r border-[rgba(74,52,34,0.08)] bg-white/70 px-4 py-4 last:border-r-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(74,52,34,0.08)] text-sm font-semibold text-foreground">
                        {getInitials(professional.name)}
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-foreground">{professional.name}</p>
                        <p className="text-sm text-muted-foreground">{professional.specialty}</p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="border-r border-[rgba(74,52,34,0.08)] bg-white/45">
                  <div className="relative" style={{ height: `${timelineHeight}px` }}>
                    {timeSlots.map((time, index) => {
                      const shouldLabel = Number(time.split(":")[1]) % 30 === 0;

                      return (
                        <div
                          key={time}
                          className="absolute left-0 right-0 border-b border-[rgba(74,52,34,0.08)] px-4 text-sm text-muted-foreground"
                          style={{
                            top: `${index * SLOT_HEIGHT}px`,
                            height: `${SLOT_HEIGHT}px`,
                          }}
                        >
                          {shouldLabel ? time : ""}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {visibleProfessionals.map((professional) => {
                  const columnAppointments = appointmentsByProfessional.get(String(professional.id)) ?? [];

                  return (
                    <div
                      key={`column-${professional.id}`}
                      className="relative border-r border-[rgba(74,52,34,0.08)] bg-white/35 last:border-r-0"
                      style={{ height: `${timelineHeight}px` }}
                    >
                      {timeSlots.map((time, index) => (
                        <div
                          key={`${professional.id}-${time}-slot`}
                          className={cn(
                            "absolute left-0 right-0 border-b border-[rgba(74,52,34,0.08)] transition-colors",
                            dragOverSlot === `${professional.id}-${time}` ? "bg-primary/10" : "",
                          )}
                          style={{
                            top: `${index * SLOT_HEIGHT}px`,
                            height: `${SLOT_HEIGHT}px`,
                          }}
                          onDragOver={(event) => {
                            event.preventDefault();
                            setDragOverSlot(`${professional.id}-${time}`);
                          }}
                          onDragLeave={() => {
                            setDragOverSlot((current) =>
                              current === `${professional.id}-${time}` ? null : current,
                            );
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            handleDropAppointment(String(professional.id), time);
                          }}
                        />
                      ))}

                      {columnAppointments.map((appointment) => {
                        const top =
                          ((timeToMinutes(appointment.time) - DAY_START_HOUR * 60) / SLOT_INTERVAL_MINUTES) *
                          SLOT_HEIGHT;
                        const height =
                          (APPOINTMENT_DURATION_IN_MINUTES / SLOT_INTERVAL_MINUTES) * SLOT_HEIGHT - 6;

                        return (
                          <div
                            key={appointment.id}
                            className={cn(
                              "absolute left-2 right-2 cursor-grab overflow-hidden rounded-[1rem] border px-3 py-2 shadow-[0_16px_35px_-28px_rgba(73,47,22,0.45)] active:cursor-grabbing",
                              statusStyles[appointment.status].card,
                              draggedAppointmentId === appointment.id ? "opacity-60" : "",
                            )}
                            style={{
                              top: `${top + 3}px`,
                              height: `${Math.max(height, SLOT_HEIGHT - 6)}px`,
                            }}
                            draggable
                            onDragStart={() => setDraggedAppointmentId(appointment.id)}
                            onDragOver={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setDragOverSlot(`${appointment.professionalId}-${appointment.time}`);
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleDropAppointment(appointment.professionalId, appointment.time);
                            }}
                            onDragEnd={() => {
                              setDraggedAppointmentId(null);
                              setDragOverSlot(null);
                            }}
                          >
                            <div className="flex h-full flex-col">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-lg font-semibold text-foreground">
                                    {appointment.time}
                                  </p>
                                  <p className="truncate text-base text-foreground">
                                    {appointment.client}
                                  </p>
                                  <p className="mt-1 truncate text-sm text-muted-foreground">{appointment.service}</p>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className="rounded-full p-1 text-muted-foreground transition hover:bg-black/5 hover:text-foreground"
                                      aria-label="Ações do agendamento"
                                      draggable={false}
                                      onPointerDown={(event) => event.stopPropagation()}
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => openEditDialog(appointment)}>
                                      <Pencil className="h-4 w-4" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onSelect={() => handleDeleteAppointment(appointment.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </SectionCard>
      <Dialog open={editingAppointmentId !== null} onOpenChange={(open) => (!open ? resetEditDialog() : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar agendamento</DialogTitle>
            <DialogDescription>
              Ajuste cliente, servico, horario, profissional e status sem sair da timeline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timeline-client">Cliente</Label>
              <Input
                id="timeline-client"
                value={appointmentDraft.client}
                onChange={(event) =>
                  setAppointmentDraft((currentDraft) => ({
                    ...currentDraft,
                    client: event.target.value,
                  }))
                }
                placeholder="Nome do cliente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline-service">Servico</Label>
              <Input
                id="timeline-service"
                value={appointmentDraft.service}
                onChange={(event) =>
                  setAppointmentDraft((currentDraft) => ({
                    ...currentDraft,
                    service: event.target.value,
                  }))
                }
                placeholder="Servico agendado"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timeline-time">Horario</Label>
                <Select
                  value={appointmentDraft.time}
                  onValueChange={(value) =>
                    setAppointmentDraft((currentDraft) => ({
                      ...currentDraft,
                      time: value,
                    }))
                  }
                >
                  <SelectTrigger id="timeline-time">
                    <SelectValue placeholder="Escolha o horario" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeline-professional">Profissional</Label>
                <Select
                  value={appointmentDraft.professionalId}
                  onValueChange={(value) =>
                    setAppointmentDraft((currentDraft) => ({
                      ...currentDraft,
                      professionalId: value,
                    }))
                  }
                >
                  <SelectTrigger id="timeline-professional">
                    <SelectValue placeholder="Escolha o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((professional) => (
                      <SelectItem key={professional.id} value={String(professional.id)}>
                        {professional.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline-status">Status</Label>
              <Select
                value={appointmentDraft.status}
                onValueChange={(value: AppointmentStatus) =>
                  setAppointmentDraft((currentDraft) => ({
                    ...currentDraft,
                    status: value,
                  }))
                }
              >
                <SelectTrigger id="timeline-status">
                  <SelectValue placeholder="Escolha o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetEditDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAppointmentEdit}>Salvar alteracoes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster position="bottom-left" closeButton richColors />
    </PageShell>
  );
}
