import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router";

import { useAuth } from "../auth/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { PageShell, SectionCard } from "../components/PageShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  formatPhone,
  normalizeClientField,
  validateClientForm,
  type ClientFormData,
  type ClientFormErrors,
} from "../data/clients";
import { FIELD_LIMITS } from "../lib/field-rules";
import { getApiErrorMessage } from "../lib/api-error";
import { createClientsService, type ClientApiItem } from "../services/clients";

const initialFormData: ClientFormData = {
  name: "",
  email: "",
  phone: "",
  cpf: "",
  notes: "",
};

export function ClienteFormulario() {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const clientId = params.clientId ? Number(params.clientId) : null;
  const locationState = location.state as { client?: ClientApiItem } | null;
  const [existingClient, setExistingClient] = useState<ClientApiItem | null>(
    clientId === null ? null : locationState?.client ?? null,
  );
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<ClientFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(Boolean(clientId && !locationState?.client));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = clientId !== null;

  useEffect(() => {
    if (!existingClient) {
      return;
    }

    setFormData({
      name: existingClient.name,
      email: existingClient.email,
      phone: existingClient.phone,
      cpf: normalizeClientField("cpf", existingClient.cpf ?? ""),
      notes: existingClient.notes,
    });
  }, [existingClient]);

  useEffect(() => {
    if (!isEditing || clientId === null || existingClient || !token) {
      if (!token && isEditing) {
        setIsLoadingClient(false);
      }

      return;
    }

    let isMounted = true;

    const loadClient = async () => {
      try {
        const response = await createClientsService(token).getById(clientId);

        if (!isMounted) {
          return;
        }

        setExistingClient(response.client);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSubmitError(getApiErrorMessage(error, "Nao foi possivel carregar o cliente."));
      } finally {
        if (isMounted) {
          setIsLoadingClient(false);
        }
      }
    };

    void loadClient();

    return () => {
      isMounted = false;
    };
  }, [clientId, existingClient, isEditing, token]);

  if (isEditing && !isLoadingClient && !existingClient) {
    return <Navigate to="/clientes" replace />;
  }

  const handleChange = (field: keyof ClientFormData, value: string) => {
    setFormData((currentData) => ({
      ...currentData,
      [field]: normalizeClientField(field, value),
    }));

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));

    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateClientForm(formData);
    setFormErrors(errors);
    setSubmitError(null);

    if (Object.keys(errors).length > 0) {
      return;
    }

    if (!token) {
      setSubmitError("Sua sessao expirou. Entre novamente para continuar.");
      return;
    }

    setIsSubmitting(true);

    if (isEditing && clientId !== null) {
      const clientsService = createClientsService(token);
      try {
        const response = await clientsService.update(clientId, {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          cpf: formData.cpf.trim(),
          notes: formData.notes.trim(),
        });

        navigate("/clientes", {
          replace: true,
          state: { notice: response.message },
        });
        return;
      } catch (error) {
        setSubmitError(getApiErrorMessage(error, "Nao foi possivel atualizar o cliente."));
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const clientsService = createClientsService(token);
      const response = await clientsService.create({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        cpf: formData.cpf.trim(),
        notes: formData.notes.trim(),
      });

      navigate("/clientes", {
        replace: true,
        state: { notice: response.message },
      });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Nao foi possivel cadastrar o cliente."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasErrors = Object.keys(formErrors).length > 0;

  return (
    <PageShell
      eyebrow="Clientes"
      title={isEditing ? "Editar cliente" : "Novo cliente"}
      description="Formulario separado da listagem para cadastrar ou editar um cliente."
      actions={
        <Button variant="outline" asChild>
          <Link to="/clientes">
            <ArrowLeft className="h-4 w-4" />
            Voltar para listagem
          </Link>
        </Button>
      }
    >
      <form noValidate onSubmit={handleSubmit} className="grid gap-6">
        {isEditing && isLoadingClient ? (
          <Alert className="border-border/60 bg-white/70">
            <AlertTitle>Carregando cliente</AlertTitle>
            <AlertDescription>Buscando os dados para preencher o formulario.</AlertDescription>
          </Alert>
        ) : null}

        {hasErrors ? (
          <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
            <AlertTitle>Formulario invalido</AlertTitle>
            <AlertDescription>Revise os campos marcados antes de salvar.</AlertDescription>
          </Alert>
        ) : null}

        {submitError ? (
          <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
            <AlertTitle>Nao foi possivel salvar</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        <SectionCard
          title="Dados do cliente"
          description="Todos os campos deste formulario sao obrigatorios para fechar o cadastro."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="client-name">Nome</label>
              <Input
                id="client-name"
                value={formData.name}
                onChange={(event) => handleChange("name", event.target.value)}
                aria-invalid={Boolean(formErrors.name)}
                maxLength={FIELD_LIMITS.clientName}
              />
              {formErrors.name ? <p className="text-sm text-destructive">{formErrors.name}</p> : null}
            </div>

            <div className="grid gap-2">
              <label htmlFor="client-email">E-mail</label>
              <Input
                id="client-email"
                type="email"
                value={formData.email}
                onChange={(event) => handleChange("email", event.target.value)}
                aria-invalid={Boolean(formErrors.email)}
                maxLength={FIELD_LIMITS.email}
              />
              {formErrors.email ? <p className="text-sm text-destructive">{formErrors.email}</p> : null}
            </div>

            <div className="grid gap-2">
              <label htmlFor="client-phone">Telefone</label>
              <Input
                id="client-phone"
                value={formatPhone(formData.phone)}
                onChange={(event) => handleChange("phone", event.target.value)}
                inputMode="numeric"
                aria-invalid={Boolean(formErrors.phone)}
                maxLength={FIELD_LIMITS.phoneFormatted}
              />
              {formErrors.phone ? (
                <p className="text-sm text-destructive">{formErrors.phone}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Informe o numero com DDD.</p>
              )}
            </div>

            <div className="grid gap-2">
              <label htmlFor="client-cpf">CPF</label>
              <Input
                id="client-cpf"
                value={formData.cpf}
                onChange={(event) => handleChange("cpf", event.target.value)}
                inputMode="numeric"
                placeholder="000.000.000-00"
                aria-invalid={Boolean(formErrors.cpf)}
                maxLength={FIELD_LIMITS.cpfFormatted}
              />
              {formErrors.cpf ? (
                <p className="text-sm text-destructive">{formErrors.cpf}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Opcional, mas precisa ser valido se preenchido.</p>
              )}
            </div>

            <div className="grid gap-2 md:col-span-2">
              <label htmlFor="client-notes">Observacoes</label>
              <Textarea
                id="client-notes"
                value={formData.notes}
                onChange={(event) => handleChange("notes", event.target.value)}
                rows={4}
                aria-invalid={Boolean(formErrors.notes)}
                maxLength={FIELD_LIMITS.notes}
              />
              {formErrors.notes ? <p className="text-sm text-destructive">{formErrors.notes}</p> : null}
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4" />
            {isSubmitting ? "Salvando..." : isEditing ? "Salvar alteracoes" : "Cadastrar cliente"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/clientes">Cancelar</Link>
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
