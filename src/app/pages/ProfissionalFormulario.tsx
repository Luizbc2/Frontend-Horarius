import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router";

import { useAuth } from "../auth/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { PageShell, SectionCard } from "../components/PageShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { formatPhone } from "../data/clients";
import {
  normalizeProfessionalField,
  updateProfessional,
  validateProfessionalForm,
  type Professional,
  type ProfessionalFormData,
  type ProfessionalFormErrors,
} from "../data/professionals";
import { getApiErrorMessage } from "../lib/api-error";
import { FIELD_LIMITS } from "../lib/field-rules";
import { createProfessionalsService, type ProfessionalApiItem } from "../services/professionals";

const initialFormData: ProfessionalFormData = {
  name: "",
  email: "",
  phone: "",
  specialty: "",
  status: "ativo",
};

export function ProfissionalFormulario() {
  const { token, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const professionalId = params.professionalId ? Number(params.professionalId) : null;
  const locationState = location.state as { professional?: Professional } | null;
  const [existingProfessional, setExistingProfessional] = useState<ProfessionalApiItem | null>(
    professionalId === null ? null : locationState?.professional ?? null,
  );
  const [formData, setFormData] = useState<ProfessionalFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<ProfessionalFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoadingProfessional, setIsLoadingProfessional] = useState(
    Boolean(professionalId && !locationState?.professional),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = professionalId !== null;

  useEffect(() => {
    if (!existingProfessional) {
      return;
    }

    setFormData({
      name: existingProfessional.name,
      email: existingProfessional.email,
      phone: existingProfessional.phone,
      specialty: existingProfessional.specialty,
      status: existingProfessional.status,
    });
  }, [existingProfessional]);

  useEffect(() => {
    if (!isEditing || professionalId === null || existingProfessional || !token) {
      if (!token && isEditing) {
        setIsLoadingProfessional(false);
      }

      return;
    }

    let isMounted = true;

    const loadProfessional = async () => {
      try {
        const response = await createProfessionalsService(token).getById(professionalId);

        if (!isMounted) {
          return;
        }

        setExistingProfessional(response.professional);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSubmitError(getApiErrorMessage(error, "Não foi possível carregar o profissional."));
      } finally {
        if (isMounted) {
          setIsLoadingProfessional(false);
        }
      }
    };

    void loadProfessional();

    return () => {
      isMounted = false;
    };
  }, [existingProfessional, isEditing, professionalId, token]);

  if (isEditing && !isLoadingProfessional && !existingProfessional) {
    return <Navigate to="/profissionais" replace />;
  }

  const handleChange = (field: keyof ProfessionalFormData, value: string) => {
    setFormData((currentData) => ({
      ...currentData,
      [field]: normalizeProfessionalField(field, value),
    }));

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));

    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateProfessionalForm(formData);
    setFormErrors(errors);
    setSubmitError(null);

    if (Object.keys(errors).length > 0) {
      return;
    }

    if (!token || !user) {
      setSubmitError("Sua sessão expirou. Entre novamente para continuar.");
      return;
    }

    setIsSubmitting(true);

    if (isEditing && professionalId !== null) {
      const professionalsService = createProfessionalsService(token);

      try {
        const response = await professionalsService.update(professionalId, {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          specialty: formData.specialty.trim(),
          status: formData.status,
        });

        updateProfessional(user.id, professionalId, formData);

        navigate("/profissionais", {
          replace: true,
          state: { notice: response.message },
        });
        return;
      } catch (error) {
        setSubmitError(getApiErrorMessage(error, "Não foi possível atualizar o profissional."));
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const professionalsService = createProfessionalsService(token);
      const response = await professionalsService.create({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        specialty: formData.specialty.trim(),
        status: formData.status,
      });

      navigate("/profissionais", {
        replace: true,
        state: { notice: response.message },
      });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Não foi possível cadastrar o profissional."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasErrors = Object.keys(formErrors).length > 0;

  return (
    <PageShell
      eyebrow="Profissionais"
      title={isEditing ? "Editar profissional" : "Novo profissional"}
      description="Cadastre os dados principais do profissional. Depois você pode ajustar os horários de trabalho com mais calma."
      actions={
        <Button variant="outline" asChild>
          <Link to="/profissionais">
            <ArrowLeft className="h-4 w-4" />
            Voltar para listagem
          </Link>
        </Button>
      }
    >
      <form noValidate onSubmit={handleSubmit} className="grid gap-6">
        {isEditing && isLoadingProfessional ? (
          <Alert className="border-border/60 bg-white/70">
            <AlertTitle>Carregando profissional</AlertTitle>
            <AlertDescription>Buscando os dados para preencher o formulário.</AlertDescription>
          </Alert>
        ) : null}

        {hasErrors ? (
          <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
            <AlertTitle>Formulário inválido</AlertTitle>
            <AlertDescription>Revise os campos marcados antes de salvar.</AlertDescription>
          </Alert>
        ) : null}

        {submitError ? (
          <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
            <AlertTitle>Não foi possível salvar</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        <SectionCard
          title="Dados do profissional"
          description="Aqui ficam os dados principais da pessoa. Os horários não entram neste formulário para não misturar cadastro com agenda."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="professional-name">Nome</label>
              <Input
                id="professional-name"
                value={formData.name}
                onChange={(event) => handleChange("name", event.target.value)}
                aria-invalid={Boolean(formErrors.name)}
                maxLength={FIELD_LIMITS.professionalName}
              />
              {formErrors.name ? <p className="text-sm text-destructive">{formErrors.name}</p> : null}
            </div>

            <div className="grid gap-2">
              <label htmlFor="professional-email">E-mail</label>
              <Input
                id="professional-email"
                type="email"
                value={formData.email}
                onChange={(event) => handleChange("email", event.target.value)}
                aria-invalid={Boolean(formErrors.email)}
                maxLength={FIELD_LIMITS.email}
              />
              {formErrors.email ? <p className="text-sm text-destructive">{formErrors.email}</p> : null}
            </div>

            <div className="grid gap-2">
              <label htmlFor="professional-phone">Telefone</label>
              <Input
                id="professional-phone"
                value={formatPhone(formData.phone)}
                onChange={(event) => handleChange("phone", event.target.value)}
                inputMode="numeric"
                aria-invalid={Boolean(formErrors.phone)}
                maxLength={FIELD_LIMITS.phoneFormatted}
              />
              {formErrors.phone ? <p className="text-sm text-destructive">{formErrors.phone}</p> : null}
            </div>

            <div className="grid gap-2">
              <label htmlFor="professional-specialty">Especialidade</label>
              <Input
                id="professional-specialty"
                value={formData.specialty}
                onChange={(event) => handleChange("specialty", event.target.value)}
                aria-invalid={Boolean(formErrors.specialty)}
                maxLength={FIELD_LIMITS.specialty}
              />
              {formErrors.specialty ? (
                <p className="text-sm text-destructive">{formErrors.specialty}</p>
              ) : null}
            </div>

            <div className="grid gap-2 md:col-span-2">
              <label>Status</label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger aria-invalid={Boolean(formErrors.status)}>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="ferias">Férias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4" />
            {isSubmitting ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar profissional"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/profissionais">Cancelar</Link>
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
