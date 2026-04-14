export type ClientEntity = {
  id: number;
  name: string;
  email: string;
  phone: string;
  notes: string;
  cpf?: string;
};

export type ServiceEntity = {
  id: number;
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
  description: string;
};

export type ProfessionalEntity = {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  status: string;
};

export type ProfessionalWorkDayEntity = {
  id: number;
  professionalId: number;
  dayOfWeek: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
};

export type AppointmentStatus = "confirmado" | "pendente" | "cancelado";

export type AppointmentEntity = {
  id: number;
  clientId: number;
  clientName: string;
  professionalId: number;
  professionalName: string;
  serviceId: number;
  serviceName: string;
  scheduledAt: string;
  status: AppointmentStatus;
  notes: string;
};
