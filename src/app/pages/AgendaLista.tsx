import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Search,
  ShieldCheck,
  TimerReset,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/button";
import { MetricCard, PageShell, SectionCard } from "../components/PageShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { getApiErrorMessage } from "../lib/api-error";
import { loadProfessionals } from "../data/professionals";
import {
  createAppointmentsService,
  type AppointmentApiItem,
  type AppointmentStatus,
} from "../services/appointments";

type AgendaListItem = {
  id: number;
  date: string;
  time: string;
  client: string;
  professional: string;
  service: string;
  status: AppointmentStatus;
};

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function getTodayDateValue() {
  const currentDate = new Date();

  return `${currentDate.getFullYear()}-${padDatePart(currentDate.getMonth() + 1)}-${padDatePart(currentDate.getDate())}`;
}

function formatAppointmentForList(appointment: AppointmentApiItem): AgendaListItem {
  const scheduledDate = new Date(appointment.scheduledAt);

  return {
    id: appointment.id,
    date: scheduledDate.toLocaleDateString("pt-BR"),
    time: scheduledDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    client: appointment.clientName,
    professional: appointment.professionalName,
    service: appointment.serviceName,
    status: appointment.status,
  };
}

export function AgendaLista() {
  const { token } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayDateValue);
  const [selectedProfessional, setSelectedProfessional] = useState("todos");
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [appointments, setAppointments] = useState<AgendaListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const itemsPerPage = 10;
  const professionals = useMemo(() => loadProfessionals(), []);

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
        toast.error(getApiErrorMessage(error, "Não foi possível carregar os agendamentos."));
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado":
        return "bg-green-100 text-green-800";
      case "pendente":
        return "bg-yellow-100 text-yellow-800";
      case "cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmado":
        return "Confirmado";
      case "pendente":
        return "Pendente";
      case "cancelado":
        return "Cancelado";
      default:
        return status;
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    if (
      searchTerm &&
      !`${appointment.client} ${appointment.service} ${appointment.professional}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);
  const confirmedCount = filteredAppointments.filter((appointment) => appointment.status === "confirmado").length;
  const pendingCount = filteredAppointments.filter((appointment) => appointment.status === "pendente").length;

  const handleRefresh = async () => {
    setRefreshKey((currentKey) => currentKey + 1);
  };

  const handleUnavailableAction = (label: string) => {
    toast.error(`${label} ainda vai ser ligada na API nos próximos passos.`);
  };

  return (
    <PageShell
      eyebrow="Gestão diária"
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
        description="Combine data, profissional e status para reduzir a lista e agir mais rápido sobre cada atendimento."
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

        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/52 shadow-[0_24px_55px_-34px_rgba(73,47,22,0.28)]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data e hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[96px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      Carregando agendamentos...
                    </TableCell>
                  </TableRow>
                ) : paginatedAppointments.length > 0 ? (
                  paginatedAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{appointment.date}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            {appointment.time}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{appointment.client}</TableCell>
                      <TableCell>{appointment.service}</TableCell>
                      <TableCell>{appointment.professional}</TableCell>
                      <TableCell>
                        <span
                          className={`${getStatusColor(appointment.status)} inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]`}
                        >
                          {getStatusLabel(appointment.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleUnavailableAction("Os detalhes")}>
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleUnavailableAction("A edição")}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleUnavailableAction("A confirmação")}>
                              Confirmar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => handleUnavailableAction("O cancelamento")}
                            >
                              Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      Nenhum agendamento encontrado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredAppointments.length > 0 ? (
            <div className="flex flex-col gap-3 border-t border-[rgba(74,52,34,0.08)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {paginatedAppointments.length} de {filteredAppointments.length} agendamentos filtrados.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                  disabled={safePage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="data-pill text-sm">
                  Página {safePage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                  disabled={safePage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </SectionCard>
    </PageShell>
  );
}
