import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Toaster, toast } from "sonner";
import {
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { EmptyStatePanel, MetricCard, PageShell, SectionCard } from "../components/PageShell";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { AgendaAppointmentDialogs } from "../features/agenda/AgendaAppointmentDialogs";
import { AgendaTimelineBoard } from "../features/agenda/AgendaTimelineBoard";
import {
  APPOINTMENT_DURATION_IN_MINUTES,
  applyServiceDurationsToAppointments,
  createAppointmentDraft,
  createNewAppointmentDraft,
  formatDateForApi,
  generateTimeSlots,
  mapTimelineAppointment,
  SLOT_HEIGHT,
  timeToMinutes,
  type AppointmentDraft,
  type NewAppointmentDraft,
  type TimelineAppointment,
} from "../features/agenda/timeline-helpers";
import {
  applyTimelineEdit,
  buildCreateAppointmentPayload,
  buildCreateClientPayload,
  buildTimelineEditPayload,
  buildTimelineUpdatePayload,
  createTimelineEditDraft,
  findTimelineAppointment,
  findTimelineTargetAppointment,
  getAvailableTimelineSlots,
  hasTimelineOverlap,
  moveTimelineAppointment,
  swapTimelineAppointments,
  validateTimelineCreateDraft,
  validateTimelineEditDraft,
} from "../features/agenda/timeline-operations";
import { getApiErrorMessage, isMissingAuthTokenError } from "../lib/api-error";
import { createProfessionalsService, type ProfessionalApiItem } from "../services/professionals";
import { createAppointmentsService } from "../services/appointments";
import { createClientsService, type ClientApiItem } from "../services/clients";
import { createServicesService, type ServiceApiItem } from "../services/services";
import type { AppointmentStatus } from "../types/entities";

export function AgendaTimeline() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState("todos");
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [clients, setClients] = useState<ClientApiItem[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalApiItem[]>([]);
  const [services, setServices] = useState<ServiceApiItem[]>([]);
  const [appointments, setAppointments] = useState<TimelineAppointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [draggedAppointmentId, setDraggedAppointmentId] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [appointmentDraft, setAppointmentDraft] = useState<AppointmentDraft>(createAppointmentDraft());
  const [newAppointmentDraft, setNewAppointmentDraft] = useState<NewAppointmentDraft>(
    createNewAppointmentDraft(),
  );

  useEffect(() => {
    if (!token) {
      setProfessionals([]);
      return;
    }

    let isMounted = true;

    const loadProfessionals = async () => {
      try {
        const response = await createProfessionalsService(token).list({
          page: 1,
          limit: 200,
        });

        if (!isMounted) {
          return;
        }

        setProfessionals(response.data);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (!isMissingAuthTokenError(error)) {
          toast.error(getApiErrorMessage(error, "Não foi possível carregar os profissionais."));
        }
      }
    };

    void loadProfessionals();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (searchParams.get("novo") === "1") {
      setIsCreateDialogOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isCreateDialogOpen) {
      return;
    }

    if (selectedProfessional === "todos") {
      return;
    }

    setNewAppointmentDraft((currentDraft) => ({
      ...currentDraft,
      professionalId: selectedProfessional,
    }));
  }, [isCreateDialogOpen, selectedProfessional]);

  useEffect(() => {
    if (!token) {
      setClients([]);
      setServices([]);
      return;
    }

    let isMounted = true;

    const loadSupportData = async () => {
      try {
        const [clientsResponse, servicesResponse] = await Promise.all([
          createClientsService(token).list({
            page: 1,
            limit: 200,
          }),
          createServicesService(token).list({
            page: 1,
            limit: 200,
          }),
        ]);

        if (!isMounted) {
          return;
        }

        setClients(clientsResponse.data);
        setServices(servicesResponse.data);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        toast.error(getApiErrorMessage(error, "Não foi possível carregar clientes e serviços."));
      }
    };

    void loadSupportData();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      setAppointments([]);
      return;
    }

    if (Number.isNaN(selectedDate.getTime())) {
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
          professionalId:
            selectedProfessional !== "todos" ? Number(selectedProfessional) : undefined,
          status: selectedStatus !== "todos" ? (selectedStatus as AppointmentStatus) : undefined,
        });

        if (!isMounted) {
          return;
        }

        setAppointments(response.data.map(mapTimelineAppointment));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setAppointments([]);

        if (!isMissingAuthTokenError(error)) {
          toast.error(getApiErrorMessage(error, "Não foi possível carregar os agendamentos."));
        }
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
  }, [selectedDate, selectedProfessional, selectedStatus, token, refreshKey]);

  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const timelineHeight = timeSlots.length * SLOT_HEIGHT;
  const serviceDurations = useMemo(
    () => new Map(services.map((service) => [service.id, service.durationMinutes])),
    [services],
  );
  const appointmentsWithDurations = useMemo(
    () => applyServiceDurationsToAppointments(appointments, serviceDurations),
    [appointments, serviceDurations],
  );

  const visibleProfessionals = useMemo(() => {
    if (selectedProfessional === "todos") {
      return professionals;
    }

    return professionals.filter((professional) => String(professional.id) === selectedProfessional);
  }, [professionals, selectedProfessional]);

  const filteredAppointments = useMemo(
    () =>
      appointmentsWithDurations.filter((appointment) => {
        if (selectedProfessional !== "todos" && appointment.professionalId !== selectedProfessional) {
          return false;
        }

        if (selectedStatus !== "todos" && appointment.status !== selectedStatus) {
          return false;
        }

        return true;
      }),
    [appointmentsWithDurations, selectedProfessional, selectedStatus],
  );

  const appointmentsByProfessional = useMemo(() => {
    const grouped = new Map<string, TimelineAppointment[]>();

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
  const selectedCreateService = useMemo(
    () => services.find((service) => String(service.id) === newAppointmentDraft.serviceId) ?? null,
    [newAppointmentDraft.serviceId, services],
  );
  const availableCreateTimeSlots = useMemo(() => {
    if (!newAppointmentDraft.professionalId || !selectedCreateService) {
      return [];
    }

    return getAvailableTimelineSlots(
      appointmentsWithDurations,
      newAppointmentDraft.professionalId,
      timeSlots,
      selectedCreateService.durationMinutes,
    );
  }, [
    appointmentsWithDurations,
    newAppointmentDraft.professionalId,
    selectedCreateService,
    timeSlots,
  ]);

  const confirmedCount = filteredAppointments.filter((appointment) => appointment.status === "confirmado").length;
  const pendingCount = filteredAppointments.filter((appointment) => appointment.status === "pendente").length;
  const occupiedSlots = filteredAppointments.reduce(
    (total, appointment) => total + Math.ceil(appointment.durationMinutes / 10),
    0,
  );
  const occupancyBase = visibleProfessionals.length * timeSlots.length;
  const occupancy = occupancyBase > 0 ? Math.round((occupiedSlots / occupancyBase) * 100) : 0;

  const formatTitleDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  const formatCompactDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  const isToday =
    selectedDate.toDateString() === new Date().toDateString();
  const toolbarDateLabel = isToday ? "Hoje" : formatCompactDate(selectedDate);

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

  useEffect(() => {
    if (!isCreateDialogOpen) {
      return;
    }

    if (!newAppointmentDraft.professionalId || !selectedCreateService) {
      return;
    }

    const nextTime =
      availableCreateTimeSlots.includes(newAppointmentDraft.time)
        ? newAppointmentDraft.time
        : (availableCreateTimeSlots[0] ?? "");

    if (nextTime === newAppointmentDraft.time) {
      return;
    }

    setNewAppointmentDraft((currentDraft) => ({
      ...currentDraft,
      time: nextTime,
    }));
  }, [
    availableCreateTimeSlots,
    isCreateDialogOpen,
    newAppointmentDraft.professionalId,
    newAppointmentDraft.time,
    selectedCreateService,
  ]);

  const resetCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);

      nextParams.delete("novo");

      return nextParams;
    });
    setNewAppointmentDraft(
      createNewAppointmentDraft(selectedProfessional !== "todos" ? selectedProfessional : ""),
    );
  };

  const resetEditDialog = () => {
    setEditingAppointmentId(null);
    setAppointmentDraft(createAppointmentDraft());
  };

  const handleCreateAppointment = () => {
    if (!token) {
      toast.error("Sua sessão expirou. Entre novamente para continuar.");
      return;
    }

    const validationMessage = validateTimelineCreateDraft(
      newAppointmentDraft,
      appointmentsWithDurations,
      selectedCreateService?.durationMinutes ?? APPOINTMENT_DURATION_IN_MINUTES,
    );

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    const appointmentsService = createAppointmentsService(token);
    const clientsService = createClientsService(token);
    let clientId = Number(newAppointmentDraft.clientId);

    const resolveClientId = async () => {
      if (clientId) {
        return clientId;
      }

      const createdClient = await clientsService.create(buildCreateClientPayload(newAppointmentDraft));

      clientId = createdClient.client.id;
      setClients((currentClients) => [...currentClients, createdClient.client]);

      return clientId;
    };

    void resolveClientId()
      .then((resolvedClientId) =>
        appointmentsService.create(buildCreateAppointmentPayload(resolvedClientId, newAppointmentDraft, selectedDate)),
      )
      .then((response) => {
        setAppointments((currentAppointments) => [
          ...currentAppointments,
          mapTimelineAppointment(response.appointment),
        ]);
        toast.success(response.message);
        resetCreateDialog();
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Não foi possível criar o agendamento."));
      });
  };

  const openEditDialog = (appointment: TimelineAppointment) => {
    setEditingAppointmentId(appointment.id);
    setAppointmentDraft(createTimelineEditDraft(appointment));
  };

  const handleDeleteAppointment = (appointmentId: number) => {
    if (!token) {
      toast.error("Sua sessão expirou. Entre novamente para continuar.");
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
        toast.error(getApiErrorMessage(error, "Não foi possível excluir o agendamento."));
      });
  };

  const handleDropAppointment = (professionalId: string, time: string) => {
    if (draggedAppointmentId === null) {
      return;
    }

    if (!token) {
      toast.error("Sua sessão expirou. Entre novamente para continuar.");
      setDraggedAppointmentId(null);
      setDragOverSlot(null);
      return;
    }

    const slot = { professionalId, time };
    const draggedAppointment = findTimelineAppointment(appointmentsWithDurations, draggedAppointmentId);

    if (!draggedAppointment) {
      setDraggedAppointmentId(null);
      setDragOverSlot(null);
      return;
    }

    const targetAppointment = findTimelineTargetAppointment(
      appointmentsWithDurations,
      draggedAppointmentId,
      slot,
    );

    if (targetAppointment) {
      const previousAppointments = appointments;
      const nextAppointments = swapTimelineAppointments(
        appointmentsWithDurations,
        draggedAppointment,
        targetAppointment,
      );

      setAppointments(nextAppointments);

      const appointmentsService = createAppointmentsService(token);

      void Promise.all([
        appointmentsService.update(
          draggedAppointment.id,
          buildTimelineUpdatePayload(draggedAppointment, targetAppointment, selectedDate),
        ),
        appointmentsService.update(
          targetAppointment.id,
          buildTimelineUpdatePayload(targetAppointment, draggedAppointment, selectedDate),
        ),
      ]).catch((error) => {
        setAppointments(previousAppointments);
        toast.error(getApiErrorMessage(error, "Não foi possível trocar os agendamentos."));
      });

      setDraggedAppointmentId(null);
      setDragOverSlot(null);
      return;
    }

    const hasConflict = hasTimelineOverlap(
      appointmentsWithDurations,
      draggedAppointmentId,
      slot,
      draggedAppointment.durationMinutes,
    );

    if (hasConflict) {
      toast.error("Esse horário já está ocupado para esse profissional.");
      setDraggedAppointmentId(null);
      setDragOverSlot(null);
      return;
    }

    const previousAppointments = appointments;
    const nextAppointments = moveTimelineAppointment(appointmentsWithDurations, draggedAppointmentId, slot);

    setAppointments(nextAppointments);

    const appointmentsService = createAppointmentsService(token);

    void appointmentsService
      .update(draggedAppointment.id, buildTimelineUpdatePayload(draggedAppointment, slot, selectedDate))
      .catch((error) => {
        setAppointments(previousAppointments);
        toast.error(getApiErrorMessage(error, "Não foi possível mover o agendamento."));
      });

    setDraggedAppointmentId(null);
    setDragOverSlot(null);
  };

  const handleSaveAppointmentEdit = () => {
    if (editingAppointmentId === null) {
      return;
    }

    if (!token) {
      toast.error("Sua sessão expirou. Entre novamente para continuar.");
      return;
    }

    const currentAppointment = findTimelineAppointment(appointmentsWithDurations, editingAppointmentId);
    const validationMessage = validateTimelineEditDraft(
      appointmentsWithDurations,
      editingAppointmentId,
      appointmentDraft,
      currentAppointment?.durationMinutes ?? APPOINTMENT_DURATION_IN_MINUTES,
    );

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }


    if (!currentAppointment) {
      toast.error("Agendamento não encontrado.");
      return;
    }

    const normalizedClient = appointmentDraft.client.trim();
    const normalizedService = appointmentDraft.service.trim();
    const previousAppointments = appointments;
    const nextAppointments = applyTimelineEdit({
      appointments: appointmentsWithDurations,
      appointmentId: editingAppointmentId,
      draft: appointmentDraft,
      normalizedClient,
      normalizedService,
    });

    setAppointments(nextAppointments);
    resetEditDialog();

    const appointmentsService = createAppointmentsService(token);

    void appointmentsService
      .update(editingAppointmentId, buildTimelineEditPayload(currentAppointment, appointmentDraft, selectedDate))
      .then((response) => {
        setAppointments((currentAppointments) =>
          currentAppointments.map((appointment) =>
            appointment.id === editingAppointmentId
              ? {
                  ...appointment,
                  client: response.appointment.clientName,
                  service: response.appointment.serviceName,
                  ...mapTimelineAppointment(response.appointment),
                }
              : appointment,
          ),
        );
        toast.success(response.message);
      })
      .catch((error) => {
        setAppointments(previousAppointments);
        toast.error(getApiErrorMessage(error, "Não foi possível atualizar o agendamento."));
      });
  };

  return (
    <PageShell
      eyebrow="Agenda"
      title="Timeline do dia"
      description="Visualize os horários lado a lado por profissional e acompanhe os encaixes do dia com mais clareza."
      actions={
        <>
          <Button
            variant="default"
            onClick={() => {
              setSearchParams((currentParams) => {
                const nextParams = new URLSearchParams(currentParams);

                nextParams.set("novo", "1");

                return nextParams;
              });
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo agendamento
          </Button>
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarDays className="h-4 w-4" />
                    {toolbarDateLabel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                      }
                    }}
                    initialFocus
                  />
                  <div className="border-t px-3 py-3">
                    <Button variant="outline" className="w-full" onClick={today}>
                      Ir para hoje
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
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
        <AgendaTimelineBoard
          appointmentsByProfessional={appointmentsByProfessional}
          draggedAppointmentId={draggedAppointmentId}
          dragOverSlot={dragOverSlot}
          isLoadingAppointments={isLoadingAppointments}
          professionals={professionals}
          timeSlots={timeSlots}
          timelineHeight={timelineHeight}
          visibleProfessionals={visibleProfessionals}
          setDraggedAppointmentId={setDraggedAppointmentId}
          setDragOverSlot={setDragOverSlot}
          onDeleteAppointment={handleDeleteAppointment}
          onDropAppointment={handleDropAppointment}
          onEditAppointment={openEditDialog}
        />
      </SectionCard>
      <AgendaAppointmentDialogs
        availableCreateTimeSlots={availableCreateTimeSlots}
        appointmentDraft={appointmentDraft}
        clients={clients}
        editingAppointmentId={editingAppointmentId}
        isCreateDialogOpen={isCreateDialogOpen}
        newAppointmentDraft={newAppointmentDraft}
        professionals={professionals}
        selectedDate={selectedDate}
        services={services}
        setSelectedDate={setSelectedDate}
        setAppointmentDraft={setAppointmentDraft}
        setNewAppointmentDraft={setNewAppointmentDraft}
        selectedCreateService={selectedCreateService}
        timeSlots={timeSlots}
        onCloseCreateDialog={resetCreateDialog}
        onCreateAppointment={handleCreateAppointment}
        onOpenCreateDialog={() => {
          setSearchParams((currentParams) => {
            const nextParams = new URLSearchParams(currentParams);

            nextParams.set("novo", "1");

            return nextParams;
          });
          setIsCreateDialogOpen(true);
        }}
        onResetEditDialog={resetEditDialog}
        onSaveAppointmentEdit={handleSaveAppointmentEdit}
      />
      <Toaster position="bottom-left" closeButton richColors />
    </PageShell>
  );
}


