import { useState } from "react";
import { Link } from "react-router";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Search,
  ShieldCheck,
  TimerReset,
} from "lucide-react";

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

type AppointmentStatus = "confirmado" | "pendente" | "cancelado";

type Appointment = {
  id: number;
  date: string;
  time: string;
  client: string;
  service: string;
  professional: string;
  status: AppointmentStatus;
};

const appointments = [
  {
    id: 1,
    date: "09/03/2026",
    time: "10:00",
    client: "Mariana Costa",
    service: "Corte + Barba",
    professional: "João",
    status: "confirmado",
  },
  {
    id: 2,
    date: "09/03/2026",
    time: "14:30",
    client: "Pedro Santos",
    service: "Corte Simples",
    professional: "João",
    status: "pendente",
  },
  {
    id: 3,
    date: "10/03/2026",
    time: "09:00",
    client: "Carlos Oliveira",
    service: "Barba",
    professional: "João",
    status: "confirmado",
  },
  {
    id: 4,
    date: "10/03/2026",
    time: "15:00",
    client: "Rafael Costa",
    service: "Corte + Barba",
    professional: "João",
    status: "cancelado",
  },
] satisfies Appointment[];

export function AgendaLista() {
  const [selectedDate] = useState("2026-03-09");
  const [selectedProfessional, setSelectedProfessional] = useState("todos");
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const filteredAppointments = appointments.filter((apt) => {
    if (selectedProfessional !== "todos" && apt.professional.toLowerCase() !== selectedProfessional) {
      return false;
    }

    if (selectedStatus !== "todos" && apt.status !== selectedStatus) {
      return false;
    }

    if (searchTerm && !`${apt.client} ${apt.service}`.toLowerCase().includes(searchTerm.toLowerCase())) {
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

  return (
    <PageShell
      eyebrow="Gestão diária"
      title="Lista de agendamentos"
      description="Filtre a operação por profissional, status e busca textual para encontrar rapidamente qualquer atendimento do dia."
      actions={
        <Button variant="secondary" asChild>
          <Link to="/agenda/timeline">Abrir timeline</Link>
        </Button>
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
          <Input type="date" value={selectedDate} readOnly />

          <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
            <SelectTrigger>
              <SelectValue placeholder="Profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos profissionais</SelectItem>
              <SelectItem value="joão">João</SelectItem>
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
              placeholder="Buscar cliente ou serviço"
              className="pl-11"
            />
          </div>

          <Button variant="outline" className="w-full lg:w-auto">
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
                {paginatedAppointments.length > 0 ? (
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
                            <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Confirmar</DropdownMenuItem>
                            <DropdownMenuItem variant="destructive">Cancelar</DropdownMenuItem>
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
