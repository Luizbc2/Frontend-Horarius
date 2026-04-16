import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  CalendarRange,
  RefreshCw,
  Search,
  ShieldCheck,
  TimerReset,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/button";
import { MetricCard, PageShell, SectionCard } from "../components/PageShell";
import { AgendaListDialogs } from "../features/agenda/AgendaListDialogs";
import { AgendaListResults } from "../features/agenda/AgendaListResults";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import {
  ITEMS_PER_PAGE,
  createEditAppointmentDraft,
  filterAppointments,
  formatAppointmentForList,
  getTodayDateValue,
  type AgendaListItem,
  type EditAppointmentDraft,
} from "../features/agenda/list-helpers";
import {
  buildAgendaEditPayload,
  buildAgendaStatusPayload,
  createAgendaEditState,
  mapAgendaAppointmentResponse,
  removeAgendaAppointment,
  replaceAgendaAppointment,
  replaceAgendaAppointmentStatus,
  validateAgendaEditDraft,
} from "../features/agenda/list-operations";
import { getApiErrorMessage, isMissingAuthTokenError } from "../lib/api-error";
import { createProfessionalsService, type ProfessionalApiItem } from "../services/professionals";
import {
  createAppointmentsService,
  type AppointmentStatus,
} from "../services/appointments";
import { createClientsService, type ClientApiItem } from "../services/clients";
import { createServicesService, type ServiceApiItem } from "../services/services";

export function AgendaLista() {
  const { token } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayDateValue);
  const [selectedProfessional, setSelectedProfessional] = useState("todos");
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [clients, setClients] = useState<ClientApiItem[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalApiItem[]>([]);
  const [services, setServices] = useState<ServiceApiItem[]>([]);
  const [appointments, setAppointments] = useState<AgendaListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AgendaListItem | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [detailsAppointment, setDetailsAppointment] = useState<AgendaListItem | null>(null);
  const [editDraft, setEditDraft] = useState<EditAppointmentDraft>(createEditAppointmentDraft());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!token) {
      setClients([]);
      setProfessionals([]);
      setServices([]);
      return;
    }

    let isMounted = true;

    const loadSupportData = async () => {
      try {
        const [clientsResponse, servicesResponse, professionalsResponse] = await Promise.all([
          createClientsService(token).list({ page: 1, limit: 200 }),
          createServicesService(token).list({ page: 1, limit: 200 }),
          createProfessionalsService(token).list({ page: 1, limit: 200 }),
        ]);

        if (!isMounted) {
          return;
        }

        setClients(clientsResponse.data);
        setServices(servicesResponse.data);
        setProfessionals(professionalsResponse.data);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (!isMissingAuthTokenError(error)) {
          toast.error(
            getApiErrorMessage(error, "Não foi possível carregar clientes, profissionais e serviços."),
          );
        }
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

    let isMounted = true;

    const loadAppointments = async () => {
      setIsLoading(true);

      try {
        const appointmentsService = createAppointmentsService(token);
        const response = await appointmentsService.list({
          date: selectedDate,
          limit: 200,
          page: 1,
          professionalId:
            selectedProfessional !== "todos" ? Number(selectedProfessional) : undefined,
          status: selectedStatus !== "todos" ? (selectedStatus as AppointmentStatus) : undefined,
        });

        if (!isMounted) {
          return;
        }

        setAppointments(response.data.map(formatAppointmentForList));
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
          setIsLoading(false);
        }
      }
    };

    void loadAppointments();

    return () => {
      isMounted = false;
    };
  }, [refreshKey, selectedDate, selectedProfessional, selectedStatus, token]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDate, selectedProfessional, selectedStatus]);

  const filteredAppointments = useMemo(
    () => filterAppointments(appointments, searchTerm),
    [appointments, searchTerm],
  );
  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const confirmedCount = filteredAppointments.filter((appointment) => appointment.status === "confirmado").length;
  const pendingCount = filteredAppointments.filter((appointment) => appointment.status === "pendente").length;

  const handleRefresh = () => {
    setRefreshKey((currentKey) => currentKey + 1);
  };

  const resetEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingAppointment(null);
    setEditDraft(createEditAppointmentDraft());
  };

  const resetDetailsDialog = () => {
    setIsDetailsDialogOpen(false);
    setDetailsAppointment(null);
  };

  const openEditDialog = (appointment: AgendaListItem) => {
    const nextState = createAgendaEditState(appointment);
    setEditingAppointment(nextState.appointment);
    setEditDraft(nextState.draft);
    setIsEditDialogOpen(true);
  };

  const openDetailsDialog = (appointment: AgendaListItem) => {
    setDetailsAppointment(appointment);
    setIsDetailsDialogOpen(true);
  };

  const handleSaveAppointmentEdit = async () => {
    if (!editingAppointment) {
      return;
    }

    if (!token) {
      toast.error("Sua sessão expirou. Entre novamente para continuar.");
      return;
    }

    const validationMessage = validateAgendaEditDraft(editDraft);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    try {
      const appointmentsService = createAppointmentsService(token);
      const response = await appointmentsService.update(
        editingAppointment.id,
        buildAgendaEditPayload(editingAppointment, editDraft),
      );

      setAppointments((currentAppointments) =>
        replaceAgendaAppointment(
          currentAppointments,
          editingAppointment.id,
          mapAgendaAppointmentResponse(response.appointment),
        ),
      );

      toast.success(response.message);
      resetEditDialog();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível atualizar o agendamento."));
    }
  };

  const handleUpdateAppointmentStatus = async (
    appointment: AgendaListItem,
    status: AppointmentStatus,
  ) => {
    if (!token) {
      toast.error("Sua sessão expirou. Entre novamente para continuar.");
      return;
    }

    const appointmentsService = createAppointmentsService(token);

    try {
      const response = await appointmentsService.update(appointment.id, buildAgendaStatusPayload(appointment, status));

      setAppointments((currentAppointments) =>
        replaceAgendaAppointmentStatus(currentAppointments, appointment.id, response.appointment.status),
      );

      toast.success(response.message);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível atualizar o agendamento."));
    }
  };

  const handleDeleteAppointment = async (appointment: AgendaListItem) => {
    if (!token) {
      toast.error("Sua sessão expirou. Entre novamente para continuar.");
      return;
    }

    try {
      const appointmentsService = createAppointmentsService(token);
      const response = await appointmentsService.remove(appointment.id);

      setAppointments((currentAppointments) =>
        removeAgendaAppointment(currentAppointments, appointment.id),
      );

      toast.success(response.message);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível excluir o agendamento."));
    }
  };

  return (
    <PageShell
      eyebrow="Gestao diaria"
      title="Lista de agendamentos"
      description="Filtre a operação por profissional, status e busca textual para encontrar rapidamente qualquer atendimento do dia."
      actions={
        <>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            Recarregar
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/agenda/timeline">Abrir timeline</Link>
          </Button>
        </>
      }
    >
      <div className="metric-grid">
        <MetricCard
          label="Agendamentos filtrados"
          value={String(filteredAppointments.length)}
          helper="Volume dentro dos filtros ativos"
          icon={<CalendarRange className="h-5 w-5" />}
        />
        <MetricCard
          label="Confirmados"
          value={String(confirmedCount)}
          helper="Clientes validados para atendimento"
          icon={<ShieldCheck className="h-5 w-5" />}
          accent="sand"
        />
        <MetricCard
          label="Pendentes"
          value={String(pendingCount)}
          helper="Agendamentos aguardando retorno"
          icon={<TimerReset className="h-5 w-5" />}
          accent="coral"
        />
      </div>

      <SectionCard
        title="Filtros e resultados"
        description="Combine data, profissional e status para reduzir a lista e agir mais rapido sobre cada atendimento."
      >
        <div className="grid gap-3 lg:grid-cols-[1.05fr_1fr_1fr_1.2fr_auto]">
          <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />

          <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
            <SelectTrigger>
              <SelectValue placeholder="Profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos profissionais</SelectItem>
              {professionals.map((professional) => (
                <SelectItem key={professional.id} value={String(professional.id)}>
                  {professional.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar cliente, serviço ou profissional"
              className="pl-11"
            />
          </div>

          <Button variant="outline" className="w-full lg:w-auto" onClick={handleRefresh}>
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        </div>

        <AgendaListResults
          appointments={paginatedAppointments}
          filteredCount={filteredAppointments.length}
          isLoading={isLoading}
          safePage={safePage}
          totalPages={totalPages}
          onDeleteAppointment={(appointment) => void handleDeleteAppointment(appointment)}
          onEditAppointment={openEditDialog}
          onNextPage={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
          onOpenDetails={openDetailsDialog}
          onPreviousPage={() => setCurrentPage(Math.max(1, safePage - 1))}
          onUpdateAppointmentStatus={(appointment, status) => void handleUpdateAppointmentStatus(appointment, status)}
        />
      </SectionCard>
      <AgendaListDialogs
        clients={clients}
        detailsAppointment={detailsAppointment}
        editDraft={editDraft}
        editingAppointment={editingAppointment}
        isDetailsDialogOpen={isDetailsDialogOpen}
        isEditDialogOpen={isEditDialogOpen}
        professionals={professionals}
        services={services}
        setEditDraft={setEditDraft}
        onCloseDetailsDialog={resetDetailsDialog}
        onCloseEditDialog={resetEditDialog}
        onSaveAppointmentEdit={handleSaveAppointmentEdit}
      />
    </PageShell>
  );
}


