import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RefreshCw,
  Users,
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
import { cn } from "../components/ui/utils";

type AppointmentStatus = "confirmado" | "pendente" | "cancelado";

type Appointment = {
  id: number;
  time: string;
  client: string;
  service: string;
  professional: string;
  status: AppointmentStatus;
  duration: number;
};

type ProfessionalColumn = {
  id: string;
  name: string;
  specialty: string;
};

const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
];

const professionals: ProfessionalColumn[] = [
  { id: "ricardo", name: "Ricardo", specialty: "Corte e barba" },
  { id: "joao", name: "Joao", specialty: "Corte infantil" },
];

const appointments = [
  {
    id: 1,
    time: "09:00",
    client: "Murilo Pereira Macedo",
    service: "Corte + barba",
    professional: "ricardo",
    status: "confirmado",
    duration: 2,
  },
  {
    id: 2,
    time: "09:50",
    client: "Pedro Santos",
    service: "Barba",
    professional: "ricardo",
    status: "confirmado",
    duration: 1,
  },
  {
    id: 3,
    time: "10:30",
    client: "Marcos Lima",
    service: "Corte",
    professional: "ricardo",
    status: "confirmado",
    duration: 1,
  },
  {
    id: 4,
    time: "11:10",
    client: "Rafael Costa",
    service: "Sobrancelha",
    professional: "ricardo",
    status: "pendente",
    duration: 1,
  },
] satisfies Appointment[];

const statusStyles: Record<
  AppointmentStatus,
  { card: string; badge: string; label: string }
> = {
  confirmado: {
    card: "border-emerald-300 bg-emerald-100/80",
    badge: "border-emerald-300 bg-emerald-50 text-emerald-800",
    label: "Confirmado",
  },
  pendente: {
    card: "border-amber-300 bg-amber-100/85",
    badge: "border-amber-300 bg-amber-50 text-amber-800",
    label: "Pendente",
  },
  cancelado: {
    card: "border-rose-300 bg-rose-100/80",
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

export function AgendaTimeline() {
  const [selectedDate, setSelectedDate] = useState(new Date("2026-04-01T10:00:00"));
  const [selectedProfessional, setSelectedProfessional] = useState("todos");
  const [selectedStatus, setSelectedStatus] = useState("todos");

  const visibleProfessionals = useMemo(() => {
    if (selectedProfessional === "todos") {
      return professionals;
    }

    return professionals.filter((professional) => professional.id === selectedProfessional);
  }, [selectedProfessional]);

  const filteredAppointments = appointments.filter((appointment) => {
    if (selectedProfessional !== "todos" && appointment.professional !== selectedProfessional) {
      return false;
    }

    if (selectedStatus !== "todos" && appointment.status !== selectedStatus) {
      return false;
    }

    return true;
  });

  const appointmentMap = new Map(
    filteredAppointments.map((appointment) => [`${appointment.professional}-${appointment.time}`, appointment]),
  );

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

  return (
    <PageShell
      eyebrow="Agenda"
      title="Timeline do dia"
      description="Visualize os horários lado a lado por profissional e acompanhe os encaixes do dia com mais clareza."
      actions={
        <>
          <Button variant="outline">
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

            <Button variant="outline">
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
                variant={selectedProfessional === professional.id ? "default" : "outline"}
                onClick={() => setSelectedProfessional(professional.id)}
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
        description="Cada coluna representa um profissional e cada linha representa um horário disponível no dia."
      >
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

              {timeSlots.map((time) => (
                <>
                  <div
                    key={`time-${time}`}
                    className="border-b border-r border-[rgba(74,52,34,0.08)] px-4 py-5 text-sm font-medium text-muted-foreground"
                  >
                    {time}
                  </div>

                  {visibleProfessionals.map((professional) => {
                    const appointment = appointmentMap.get(`${professional.id}-${time}`);

                    return (
                      <div
                        key={`${professional.id}-${time}`}
                        className="border-b border-r border-[rgba(74,52,34,0.08)] px-3 py-2 last:border-r-0"
                      >
                        {appointment ? (
                          <div
                            className={cn(
                              "rounded-[1rem] border px-3 py-3 shadow-[0_16px_35px_-28px_rgba(73,47,22,0.45)]",
                              statusStyles[appointment.status].card,
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xl font-semibold text-foreground">{appointment.time}</p>
                                <p className="mt-1 truncate text-lg text-foreground">{appointment.client}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{appointment.service}</p>
                              </div>
                              <button
                                type="button"
                                className="text-muted-foreground transition hover:text-foreground"
                                aria-label="Ações do agendamento"
                              >
                                •••
                              </button>
                            </div>

                            <div className="mt-3">
                              <span
                                className={cn(
                                  "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                                  statusStyles[appointment.status].badge,
                                )}
                              >
                                {statusStyles[appointment.status].label}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="min-h-[74px] rounded-[1rem] border border-dashed border-[rgba(74,52,34,0.12)] bg-white/35" />
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
    </PageShell>
  );
}
