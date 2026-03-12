import { useState } from "react";
import { Link } from "react-router";
import {
  CalendarCheck2,
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

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00"
];

const appointments = [
  {
    id: 1,
    time: "10:00",
    client: "João Silva",
    service: "Corte + Barba",
    professional: "Fodedor",
    status: "confirmado",
    duration: 1
  },
  {
    id: 2,
    time: "14:30",
    client: "Pedro Santos",
    service: "Corte Simples",
    professional: "Fodedor",
    status: "pendente",
    duration: 1
  }
] satisfies Appointment[];

const statusStyles: Record<
  AppointmentStatus,
  { card: string; badge: string; label: string }
> = {
  confirmado: {
    card: "border-emerald-200/80 bg-emerald-50/85",
    badge: "soft-badge",
    label: "Confirmado",
  },
  pendente: {
    card: "border-amber-200/80 bg-amber-50/90",
    badge: "soft-badge",
    label: "Pendente",
  },
  cancelado: {
    card: "border-rose-200/80 bg-rose-50/85",
    badge: "soft-badge",
    label: "Cancelado",
  },
};

export function AgendaTimeline() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState("todos");
  const [selectedStatus, setSelectedStatus] = useState("todos");

  const filteredAppointments = appointments.filter((appointment) => {
    if (
      selectedProfessional !== "todos" &&
      appointment.professional.toLowerCase() !== selectedProfessional
    ) {
      return false;
    }

    if (selectedStatus !== "todos" && appointment.status !== selectedStatus) {
      return false;
    }

    return true;
  });

  const appointmentMap = new Map(filteredAppointments.map((appointment) => [appointment.time, appointment]));
  const confirmedCount = filteredAppointments.filter((appointment) => appointment.status === "confirmado").length;
  const pendingCount = filteredAppointments.filter((appointment) => appointment.status === "pendente").length;
  const occupancy = Math.round((filteredAppointments.length / timeSlots.length) * 100);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long"
    });
  };

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
      eyebrow="Gestao diaria"
      title="Agenda do dia"
      description="Acompanhe a ocupacao da equipe em uma linha do tempo limpa, com filtros rapidos e leitura facil dos status de atendimento."
      actions={
        <>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4" />
            Atualizar
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
          helper="Slots preenchidos na agenda atual"
          icon={<CalendarCheck2 className="h-5 w-5" />}
        />
        <MetricCard
          label="Confirmados"
          value={String(confirmedCount)}
          helper="Clientes prontos para atendimento"
          icon={<Users className="h-5 w-5" />}
          accent="sand"
        />
        <MetricCard
          label="Ocupacao"
          value={`${occupancy}%`}
          helper={`${pendingCount} pendente${pendingCount === 1 ? "" : "s"} para confirmar`}
          icon={<Clock3 className="h-5 w-5" />}
          accent="coral"
        />
      </div>

      <SectionCard
        title="Controle do dia"
        description="Navegue entre as datas, filtre por profissional e visualize apenas o que importa para a operacao de hoje."
        action={<span className="data-pill capitalize">{formatDate(selectedDate)}</span>}
      >
        <div className="grid gap-4 xl:grid-cols-[1.35fr,1fr]">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="icon" onClick={previousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={today}>
              Hoje
            </Button>
            <div className="data-pill min-w-[220px] justify-center text-center font-medium">
              {selectedDate.toLocaleDateString("pt-BR")}
            </div>
            <Button variant="outline" size="icon" onClick={nextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
              <SelectTrigger>
                <SelectValue placeholder="Profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="fodedor">Fodedor</SelectItem>
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

            <Button variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4" />
              Sincronizar
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Grade da agenda"
        description="Uma visao linear dos horarios ajuda a encontrar janelas livres e reagendar com rapidez sem perder o contexto do dia."
      >
        <div className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/52 shadow-[0_24px_55px_-34px_rgba(73,47,22,0.28)]">
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-[110px_1fr] border-b border-[rgba(74,52,34,0.08)] bg-white/55">
                <div className="px-5 py-4">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Horario
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Profissional
                  </p>
                  <p className="mt-2 text-lg text-foreground">Fodedor</p>
                </div>
              </div>

              <div>
                {timeSlots.map((time) => {
                  const appointment = appointmentMap.get(time);

                  return (
                    <div
                      key={time}
                      className="grid grid-cols-[110px_1fr] border-b border-[rgba(74,52,34,0.08)] last:border-b-0"
                    >
                      <div className="flex items-start px-5 py-5 text-sm font-medium text-muted-foreground">
                        {time}
                      </div>
                      <div className="px-4 py-3">
                        {appointment ? (
                          <div
                            className={cn(
                              "rounded-[1.25rem] border px-4 py-4 shadow-[0_18px_45px_-32px_rgba(73,47,22,0.45)]",
                              statusStyles[appointment.status].card,
                            )}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-base font-semibold text-foreground">
                                  {appointment.client}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {appointment.service}
                                </p>
                                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                  {appointment.duration * 30} min com {appointment.professional}
                                </p>
                              </div>
                              <span className={statusStyles[appointment.status].badge}>
                                <span className="status-dot" />
                                {statusStyles[appointment.status].label}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex min-h-[86px] items-center rounded-[1.2rem] border border-dashed border-[rgba(74,52,34,0.12)] px-4 text-sm text-muted-foreground">
                            Horario livre para encaixe ou pausa tecnica.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </PageShell>
  );
}
