import type { Dispatch, SetStateAction } from "react";
import { Clock3, MoreVertical, Pencil, RefreshCw, Trash2, Users } from "lucide-react";

import { EmptyStatePanel } from "../../components/PageShell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { cn } from "../../components/ui/utils";
import {
  DAY_START_HOUR,
  SLOT_HEIGHT,
  SLOT_INTERVAL_MINUTES,
  getInitials,
  timeToMinutes,
  timelineStatusStyles,
  type TimelineAppointment,
} from "./timeline-helpers";
import type { ProfessionalApiItem } from "../../services/professionals";

type AgendaTimelineBoardProps = {
  appointmentsByProfessional: Map<string, TimelineAppointment[]>;
  draggedAppointmentId: number | null;
  dragOverSlot: string | null;
  isLoadingAppointments: boolean;
  professionals: ProfessionalApiItem[];
  timeSlots: string[];
  timelineHeight: number;
  visibleProfessionals: ProfessionalApiItem[];
  setDraggedAppointmentId: Dispatch<SetStateAction<number | null>>;
  setDragOverSlot: Dispatch<SetStateAction<string | null>>;
  onDeleteAppointment: (appointmentId: number) => void;
  onDropAppointment: (professionalId: string, time: string) => void;
  onEditAppointment: (appointment: TimelineAppointment) => void;
};

export function AgendaTimelineBoard({
  appointmentsByProfessional,
  draggedAppointmentId,
  dragOverSlot,
  isLoadingAppointments,
  professionals,
  timeSlots,
  timelineHeight,
  visibleProfessionals,
  setDraggedAppointmentId,
  setDragOverSlot,
  onDeleteAppointment,
  onDropAppointment,
  onEditAppointment,
}: AgendaTimelineBoardProps) {
  if (professionals.length === 0) {
    return (
      <EmptyStatePanel
        icon={<Users className="h-7 w-7" />}
        title="Nenhum profissional disponivel"
        description="Cadastre pelo menos um profissional para montar a timeline da agenda com colunas reais."
      />
    );
  }

  if (isLoadingAppointments) {
    return (
      <EmptyStatePanel
        icon={<RefreshCw className="h-7 w-7" />}
        title="Carregando agenda"
        description="Estamos buscando os agendamentos do dia para montar a timeline."
      />
    );
  }

  if (visibleProfessionals.length === 0) {
    return (
      <EmptyStatePanel
        icon={<Clock3 className="h-7 w-7" />}
        title="Nenhum profissional nesse filtro"
        description="Ajuste o filtro de barbeiros para voltar a exibir as colunas da agenda."
      />
    );
  }

  return (
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
                      onDropAppointment(String(professional.id), time);
                    }}
                  />
                ))}

                {columnAppointments.map((appointment) => {
                  const top =
                    ((timeToMinutes(appointment.time) - DAY_START_HOUR * 60) / SLOT_INTERVAL_MINUTES) *
                    SLOT_HEIGHT;
                  const height =
                    (appointment.durationMinutes / SLOT_INTERVAL_MINUTES) * SLOT_HEIGHT - 6;

                  return (
                    <div
                      key={appointment.id}
                      className={cn(
                        "absolute left-2 right-2 cursor-grab overflow-hidden rounded-[1rem] border px-3 py-2 shadow-[0_16px_35px_-28px_rgba(73,47,22,0.45)] active:cursor-grabbing",
                        timelineStatusStyles[appointment.status].card,
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
                        onDropAppointment(appointment.professionalId, appointment.time);
                      }}
                      onDragEnd={() => {
                        setDraggedAppointmentId(null);
                        setDragOverSlot(null);
                      }}
                    >
                      <div className="flex h-full flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-lg font-semibold text-foreground">{appointment.time}</p>
                            <p className="truncate text-base text-foreground">{appointment.client}</p>
                            <p className="mt-1 truncate text-sm text-muted-foreground">{appointment.service}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="rounded-full p-1 text-muted-foreground transition hover:bg-black/5 hover:text-foreground"
                                aria-label="Acoes do agendamento"
                                draggable={false}
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => onEditAppointment(appointment)}>
                                <Pencil className="h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => onDeleteAppointment(appointment.id)}
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
  );
}
