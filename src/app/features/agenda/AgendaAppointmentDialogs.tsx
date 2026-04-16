import type { Dispatch, SetStateAction } from "react";

import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import type { ClientApiItem } from "../../services/clients";
import type { ProfessionalApiItem } from "../../services/professionals";
import type { ServiceApiItem } from "../../services/services";
import type { AppointmentStatus } from "../../types/entities";
import type { AppointmentDraft, NewAppointmentDraft } from "./timeline-helpers";
import { formatCpf } from "../../lib/cpf";
import {
  FIELD_LIMITS,
  normalizeEmailInput,
  normalizeSingleLineTextInput,
} from "../../lib/field-rules";
import { formatPhone, normalizePhone } from "../../data/clients";

type AgendaAppointmentDialogsProps = {
  appointmentDraft: AppointmentDraft;
  clients: ClientApiItem[];
  editingAppointmentId: number | null;
  isCreateDialogOpen: boolean;
  newAppointmentDraft: NewAppointmentDraft;
  professionals: ProfessionalApiItem[];
  services: ServiceApiItem[];
  setAppointmentDraft: Dispatch<SetStateAction<AppointmentDraft>>;
  setNewAppointmentDraft: Dispatch<SetStateAction<NewAppointmentDraft>>;
  timeSlots: string[];
  onCloseCreateDialog: () => void;
  onCreateAppointment: () => void;
  onOpenCreateDialog: () => void;
  onResetEditDialog: () => void;
  onSaveAppointmentEdit: () => void;
};

export function AgendaAppointmentDialogs({
  appointmentDraft,
  clients,
  editingAppointmentId,
  isCreateDialogOpen,
  newAppointmentDraft,
  professionals,
  services,
  setAppointmentDraft,
  setNewAppointmentDraft,
  timeSlots,
  onCloseCreateDialog,
  onCreateAppointment,
  onOpenCreateDialog,
  onResetEditDialog,
  onSaveAppointmentEdit,
}: AgendaAppointmentDialogsProps) {
  return (
    <>
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            onCloseCreateDialog();
            return;
          }

          onOpenCreateDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo agendamento</DialogTitle>
            <DialogDescription>
              Selecione cliente, servico, profissional e horario para lancar um novo atendimento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timeline-new-client">Cliente</Label>
              <Select
                value={newAppointmentDraft.clientId}
                onValueChange={(value) =>
                  setNewAppointmentDraft((currentDraft) => ({
                    ...currentDraft,
                    clientId: value,
                  }))
                }
              >
                <SelectTrigger id="timeline-new-client">
                  <SelectValue placeholder="Escolha o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={String(client.id)}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-[1rem] border border-dashed border-border/80 bg-muted/30 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Dados opcionais do cliente</p>
                <p className="text-xs text-muted-foreground">
                  Se nao escolher um cliente existente, preencha nome, e-mail e telefone do novo cadastro.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="timeline-new-client-name">Nome</Label>
                  <Input
                    id="timeline-new-client-name"
                    value={newAppointmentDraft.clientName}
                    onChange={(event) =>
                      setNewAppointmentDraft((currentDraft) => ({
                        ...currentDraft,
                        clientName: normalizeSingleLineTextInput(event.target.value, FIELD_LIMITS.clientName),
                      }))
                    }
                    placeholder="Nome do cliente"
                    maxLength={FIELD_LIMITS.clientName}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeline-new-client-email">Email</Label>
                  <Input
                    id="timeline-new-client-email"
                    type="email"
                    value={newAppointmentDraft.clientEmail}
                    onChange={(event) =>
                      setNewAppointmentDraft((currentDraft) => ({
                        ...currentDraft,
                        clientEmail: normalizeEmailInput(event.target.value),
                      }))
                    }
                    placeholder="cliente@email.com"
                    maxLength={FIELD_LIMITS.email}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeline-new-client-phone">Telefone</Label>
                  <Input
                    id="timeline-new-client-phone"
                    value={formatPhone(newAppointmentDraft.clientPhone)}
                    onChange={(event) =>
                      setNewAppointmentDraft((currentDraft) => ({
                        ...currentDraft,
                        clientPhone: normalizePhone(event.target.value),
                      }))
                    }
                    placeholder="(00) 00000-0000"
                    inputMode="numeric"
                    maxLength={FIELD_LIMITS.phoneFormatted}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeline-new-client-cpf">CPF (opcional)</Label>
                  <Input
                    id="timeline-new-client-cpf"
                    value={newAppointmentDraft.clientCpf}
                    onChange={(event) =>
                      setNewAppointmentDraft((currentDraft) => ({
                        ...currentDraft,
                        clientCpf: formatCpf(event.target.value),
                      }))
                    }
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                    maxLength={FIELD_LIMITS.cpfFormatted}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline-new-service">Servico</Label>
              <Select
                value={newAppointmentDraft.serviceId}
                onValueChange={(value) =>
                  setNewAppointmentDraft((currentDraft) => ({
                    ...currentDraft,
                    serviceId: value,
                  }))
                }
              >
                <SelectTrigger id="timeline-new-service">
                  <SelectValue placeholder="Escolha o servico" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={String(service.id)}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timeline-new-time">Horario</Label>
                <Select
                  value={newAppointmentDraft.time}
                  onValueChange={(value) =>
                    setNewAppointmentDraft((currentDraft) => ({
                      ...currentDraft,
                      time: value,
                    }))
                  }
                >
                  <SelectTrigger id="timeline-new-time">
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
                <Label htmlFor="timeline-new-professional">Profissional</Label>
                <Select
                  value={newAppointmentDraft.professionalId}
                  onValueChange={(value) =>
                    setNewAppointmentDraft((currentDraft) => ({
                      ...currentDraft,
                      professionalId: value,
                    }))
                  }
                >
                  <SelectTrigger id="timeline-new-professional">
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
              <Label htmlFor="timeline-new-status">Status</Label>
              <Select
                value={newAppointmentDraft.status}
                onValueChange={(value: AppointmentStatus) =>
                  setNewAppointmentDraft((currentDraft) => ({
                    ...currentDraft,
                    status: value,
                  }))
                }
              >
                <SelectTrigger id="timeline-new-status">
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
            <Button variant="outline" onClick={onCloseCreateDialog}>
              Cancelar
            </Button>
            <Button onClick={onCreateAppointment}>Criar agendamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editingAppointmentId !== null} onOpenChange={(open) => (!open ? onResetEditDialog() : undefined)}>
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
                placeholder="Nome do cliente"
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline-service">Servico</Label>
              <Input
                id="timeline-service"
                value={appointmentDraft.service}
                placeholder="Servico agendado"
                readOnly
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
            <Button variant="outline" onClick={onResetEditDialog}>
              Cancelar
            </Button>
            <Button onClick={onSaveAppointmentEdit}>Salvar alteracoes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
