import { useEffect, useState, type FormEvent } from "react";
import {
  Mail,
  MessageCircle,
  PencilLine,
  Phone,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Toaster, toast } from "sonner";

import { EmptyStatePanel, MetricCard, PageShell, SectionCard } from "../components/PageShell";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

type Client = {
  id: number;
  name: string;
  email: string;
  phone: string;
  lastMessage: string;
  createdAt: string;
  unread: boolean;
};

type ClientFormData = {
  name: string;
  email: string;
  phone: string;
  lastMessage: string;
};

type ClientFormErrors = Partial<Record<keyof ClientFormData, string>>;

const STORAGE_KEY = "horarius:clientes";
const initialFormData: ClientFormData = {
  name: "",
  email: "",
  phone: "",
  lastMessage: "",
};

function loadClients(): Client[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedClients = window.localStorage.getItem(STORAGE_KEY);

    if (!storedClients) {
      return [];
    }

    const parsedClients = JSON.parse(storedClients) as Client[];
    return Array.isArray(parsedClients) ? parsedClients : [];
  } catch {
    return [];
  }
}

function formatConversationTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function formatPhone(value: string) {
  const digits = normalizePhone(value);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function validateField(field: keyof ClientFormData, value: string) {
  const trimmedValue = value.trim();

  if (field === "name" && !trimmedValue) {
    return "Informe o nome do cliente.";
  }

  if (field === "email" && trimmedValue) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedValue)) {
      return "Digite um e-mail válido, como nome@dominio.com.";
    }
  }

  if (field === "phone" && trimmedValue) {
    const digits = normalizePhone(trimmedValue);

    if (digits.length < 10) {
      return "Digite um telefone válido com 10 ou 11 números.";
    }
  }

  return "";
}

function validateFormData(formData: ClientFormData) {
  const errors: ClientFormErrors = {};

  (Object.keys(formData) as Array<keyof ClientFormData>).forEach((field) => {
    const error = validateField(field, formData[field]);

    if (error) {
      errors[field] = error;
    }
  });

  return errors;
}

export function Clientes() {
  const [clients, setClients] = useState<Client[]>(loadClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<ClientFormErrors>({});

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  }, [clients]);

  const filteredClients = clients.filter((client) => {
    const searchableContent = [
      client.name,
      client.email,
      client.phone,
      client.lastMessage,
    ]
      .join(" ")
      .toLowerCase();

    return searchableContent.includes(searchTerm.toLowerCase());
  });

  const unreadCount = clients.filter((client) => client.unread).length;

  const resetForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingClientId(null);
    resetForm();
  };

  const openCreateDialog = () => {
    setEditingClientId(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (client: Client) => {
    setEditingClientId(client.id);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      lastMessage: client.lastMessage,
    });
    setDialogOpen(true);
  };

  const handleChange = (field: keyof ClientFormData, value: string) => {
    const nextValue = field === "phone" ? normalizePhone(value) : value;

    setFormData((currentData) => ({
      ...currentData,
      [field]: nextValue,
    }));

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      [field]: validateField(field, nextValue),
    }));
  };

  const handleCreateOrUpdateClient = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateFormData(formData);

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Revise os campos inválidos antes de salvar.");
      return;
    }

    const trimmedName = formData.name.trim();

    if (editingClientId !== null) {
      setClients((currentClients) =>
        currentClients.map((client) =>
          client.id === editingClientId
            ? {
                ...client,
                name: trimmedName,
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                lastMessage:
                  formData.lastMessage.trim() || "Conversa atualizada agora.",
              }
            : client,
        ),
      );
      closeDialog();
      toast.success("Cliente atualizado com sucesso!");
      return;
    }

    const newClient: Client = {
      id: Date.now(),
      name: trimmedName,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      lastMessage: formData.lastMessage.trim() || "Conversa iniciada agora.",
      createdAt: new Date().toISOString(),
      unread: false,
    };

    setClients((currentClients) => [newClient, ...currentClients]);
    closeDialog();
    toast.success("Cliente cadastrado com sucesso!");
  };

  const handleDeleteClient = (clientId: number) => {
    setClients((currentClients) =>
      currentClients.filter((client) => client.id !== clientId),
    );

    if (editingClientId === clientId) {
      closeDialog();
    }

    toast.success("Cliente removido com sucesso!");
  };

  return (
    <>
      <PageShell
        eyebrow="Gestão"
        title="Relacionamento com clientes"
        description="Uma inbox mais limpa para acompanhar conversas, identificar oportunidades de retorno e manter o histórico sempre à mão."
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Novo cliente
          </Button>
        }
      >
        <div className="metric-grid">
          <MetricCard
            label="Clientes"
            value={String(clients.length)}
            helper="Base atual de clientes cadastrados"
            icon={<MessageCircle className="h-5 w-5" />}
          />
          <MetricCard
            label="Conversas ativas"
            value={String(clients.length)}
            helper="Conversas iniciadas na inbox"
            icon={<MessageCircle className="h-5 w-5" />}
            accent="sand"
          />
          <MetricCard
            label="Não lidas"
            value={String(unreadCount)}
            helper="Mensagens aguardando resposta"
            icon={<MessageCircle className="h-5 w-5" />}
            accent="coral"
          />
        </div>

        <SectionCard
          title="Inbox de conversas"
          description="Use a busca para localizar rapidamente um cliente ou abrir o canal ideal para iniciar um novo contato."
          action={
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar conversas"
                className="pl-11"
              />
            </div>
          }
        >
          {clients.length === 0 ? (
            <EmptyStatePanel
              icon={<MessageCircle className="h-7 w-7" />}
              title="Nenhuma conversa ainda"
              description="Quando você iniciar atendimentos por mensagem, a inbox vai mostrar o histórico, horário da última interação e atalhos para continuidade do contato."
              action={
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4" />
                  Adicionar cliente
                </Button>
              }
            />
          ) : filteredClients.length === 0 ? (
            <EmptyStatePanel
              icon={<Search className="h-7 w-7" />}
              title="Nenhum cliente encontrado"
              description="Ajuste o termo de busca ou cadastre um novo cliente para aparecer nesta lista."
              action={
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4" />
                  Novo cliente
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-start gap-4 rounded-[1.4rem] border border-white/70 bg-white/60 p-4 shadow-[0_18px_45px_-30px_rgba(73,47,22,0.32)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-primary text-lg font-semibold text-primary-foreground">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="truncate text-base font-semibold text-foreground">
                        {client.name}
                      </h4>
                      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {formatConversationTime(client.createdAt)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {client.lastMessage}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {client.phone ? (
                        <span className="data-pill text-xs">
                          <Phone className="h-3.5 w-3.5" />
                          {formatPhone(client.phone)}
                        </span>
                      ) : null}
                      {client.email ? (
                        <span className="data-pill text-xs">
                          <Mail className="h-3.5 w-3.5" />
                          {client.email}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(client)}
                      >
                        <PencilLine className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClient(client.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Apagar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </PageShell>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="rounded-[1.75rem] border-white/70 bg-[linear-gradient(180deg,rgba(255,251,246,0.97),rgba(248,241,231,0.94))] p-6 shadow-[0_30px_80px_-38px_rgba(73,47,22,0.34)] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-foreground">
              {editingClientId === null ? "Novo cliente" : "Editar cliente"}
            </DialogTitle>
            <DialogDescription className="leading-6">
              {editingClientId === null
                ? "Cadastro local para alimentar a inbox enquanto não temos o back-end."
                : "Atualize os dados do cliente localmente enquanto a tela ainda opera sem back-end."}
            </DialogDescription>
          </DialogHeader>

          <form noValidate onSubmit={handleCreateOrUpdateClient} className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="client-name">Nome</label>
              <Input
                id="client-name"
                value={formData.name}
                onChange={(event) => handleChange("name", event.target.value)}
                aria-invalid={Boolean(formErrors.name)}
                placeholder="Ex.: Maria Oliveira"
              />
              {formErrors.name ? (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="client-email">E-mail</label>
                <Input
                  id="client-email"
                  type="text"
                  value={formData.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  aria-invalid={Boolean(formErrors.email)}
                  placeholder="maria@cliente.com"
                  inputMode="email"
                />
                {formErrors.email ? (
                  <p className="text-sm text-destructive">{formErrors.email}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <label htmlFor="client-phone">Telefone</label>
                <Input
                  id="client-phone"
                  type="text"
                  value={formatPhone(formData.phone)}
                  onChange={(event) => handleChange("phone", event.target.value)}
                  aria-invalid={Boolean(formErrors.phone)}
                  placeholder="11999999999"
                  inputMode="numeric"
                />
                {formErrors.phone ? (
                  <p className="text-sm text-destructive">{formErrors.phone}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Use 10 ou 11 números com DDD.</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="client-message">Primeira mensagem</label>
              <Textarea
                id="client-message"
                value={formData.lastMessage}
                onChange={(event) => handleChange("lastMessage", event.target.value)}
                placeholder="Adicione uma observação ou a primeira mensagem da conversa."
                rows={4}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                <Plus className="h-4 w-4" />
                {editingClientId === null ? "Salvar cliente" : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Toaster position="bottom-left" closeButton richColors />
    </>
  );
}
