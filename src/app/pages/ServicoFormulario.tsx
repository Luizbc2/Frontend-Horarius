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
  normalizeServiceField,
  parseServicePrice,
  validateServiceForm,
  type ServiceFormData,
  type ServiceFormErrors,
} from "../data/services";
import { getApiErrorMessage } from "../lib/api-error";
import { FIELD_LIMITS } from "../lib/field-rules";
import { createServicesService, type ServiceApiItem } from "../services/services";

const initialFormData: ServiceFormData = {
  name: "",
  category: "",
  durationMinutes: "",
  price: "",
  description: "",
};

export function ServicoFormulario() {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const serviceId = params.serviceId ? Number(params.serviceId) : null;
  const locationState = location.state as { service?: ServiceApiItem } | null;
  const [existingService, setExistingService] = useState<ServiceApiItem | null>(
    serviceId === null ? null : locationState?.service ?? null,
  );
  const [formData, setFormData] = useState<ServiceFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<ServiceFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoadingService, setIsLoadingService] = useState(Boolean(serviceId && !locationState?.service));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = serviceId !== null;

  useEffect(() => {
    if (!existingService) {
      return;
    }

    setFormData({
      name: existingService.name,
      category: existingService.category,
      durationMinutes: String(existingService.durationMinutes),
      price: String(existingService.price),
      description: existingService.description,
    });
  }, [existingService]);

  useEffect(() => {
    if (!isEditing || serviceId === null || existingService || !token) {
      if (!token && isEditing) {
        setIsLoadingService(false);
      }

      return;
    }

    let isMounted = true;

    const loadService = async () => {
      try {
        const response = await createServicesService(token).getById(serviceId);

        if (!isMounted) {
          return;
        }

        setExistingService(response.service);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSubmitError(getApiErrorMessage(error, "Não foi possível carregar o serviço."));
      } finally {
        if (isMounted) {
          setIsLoadingService(false);
        }
      }
    };

    void loadService();

    return () => {
      isMounted = false;
    };
  }, [existingService, isEditing, serviceId, token]);

  if (isEditing && !isLoadingService && !existingService) {
    return <Navigate to="/servicos" replace />;
  }

  const handleChange = (field: keyof ServiceFormData, value: string) => {
    setFormData((currentData) => ({
      ...currentData,
      [field]: normalizeServiceField(field, value),
    }));

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));

    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateServiceForm(formData);
    setFormErrors(errors);
    setSubmitError(null);

    if (Object.keys(errors).length > 0) {
      return;
    }

    if (!token) {
      setSubmitError("Sua sessão expirou. Entre novamente para continuar.");
      return;
    }

    setIsSubmitting(true);

    if (isEditing && serviceId !== null) {
      const servicesService = createServicesService(token);

      try {
        const response = await servicesService.update(serviceId, {
          name: formData.name.trim(),
          category: formData.category.trim(),
          durationMinutes: Number(formData.durationMinutes),
          price: parseServicePrice(formData.price),
          description: formData.description.trim(),
        });

        navigate("/servicos", {
          replace: true,
          state: { notice: response.message },
        });
        return;
      } catch (error) {
        setSubmitError(getApiErrorMessage(error, "Não foi possível atualizar o serviço."));
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const servicesService = createServicesService(token);
      const response = await servicesService.create({
        name: formData.name.trim(),
        category: formData.category.trim(),
        durationMinutes: Number(formData.durationMinutes),
        price: parseServicePrice(formData.price),
        description: formData.description.trim(),
      });

      navigate("/servicos", {
        replace: true,
        state: { notice: response.message },
      });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Não foi possível cadastrar o serviço."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasErrors = Object.keys(formErrors).length > 0;

  return (
    <PageShell
      eyebrow="Serviços"
      title={isEditing ? "Editar serviço" : "Novo serviço"}
      description="Preencha as informações para cadastrar um novo serviço"
      actions={
        <Button variant="outline" asChild>
          <Link to="/servicos">
            <ArrowLeft className="h-4 w-4" />
            Voltar para listagem
          </Link>
        </Button>
      }
    >
      <form noValidate onSubmit={handleSubmit} className="grid gap-6">
        {isEditing && isLoadingService ? (
          <Alert className="border-border/60 bg-white/70">
            <AlertTitle>Carregando serviço</AlertTitle>
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
          title="Dados do serviço"
          description="Preencha os dados principais do serviço. A descrição pode ficar em branco, se preferir."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="service-name">Nome</label>
              <Input
                id="service-name"
                value={formData.name}
                onChange={(event) => handleChange("name", event.target.value)}
                aria-invalid={Boolean(formErrors.name)}
                maxLength={FIELD_LIMITS.serviceName}
              />
              {formErrors.name ? <p className="text-sm text-destructive">{formErrors.name}</p> : null}
            </div>

            <div className="grid gap-2">
              <label htmlFor="service-category">Categoria</label>
              <Input
                id="service-category"
                value={formData.category}
                onChange={(event) => handleChange("category", event.target.value)}
                aria-invalid={Boolean(formErrors.category)}
                maxLength={FIELD_LIMITS.serviceCategory}
              />
              {formErrors.category ? <p className="text-sm text-destructive">{formErrors.category}</p> : null}
            </div>

            <div className="grid gap-2">
              <label htmlFor="service-duration">Duração (minutos)</label>
              <Input
                id="service-duration"
                type="text"
                inputMode="numeric"
                value={formData.durationMinutes}
                onChange={(event) => handleChange("durationMinutes", event.target.value)}
                aria-invalid={Boolean(formErrors.durationMinutes)}
                maxLength={FIELD_LIMITS.serviceDurationDigits}
              />
              {formErrors.durationMinutes ? (
                <p className="text-sm text-destructive">{formErrors.durationMinutes}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label htmlFor="service-price">Preço</label>
              <Input
                id="service-price"
                type="text"
                inputMode="decimal"
                value={formData.price}
                onChange={(event) => handleChange("price", event.target.value)}
                aria-invalid={Boolean(formErrors.price)}
                maxLength={FIELD_LIMITS.servicePrice}
              />
              {formErrors.price ? <p className="text-sm text-destructive">{formErrors.price}</p> : null}
            </div>

            <div className="grid gap-2 md:col-span-2">
              <label htmlFor="service-description">Descrição opcional</label>
              <Textarea
                id="service-description"
                rows={4}
                value={formData.description}
                onChange={(event) => handleChange("description", event.target.value)}
                aria-invalid={Boolean(formErrors.description)}
                maxLength={FIELD_LIMITS.serviceDescription}
                placeholder="Escreva algo sobre o serviço, se quiser."
              />
              {formErrors.description ? (
                <p className="text-sm text-destructive">{formErrors.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Você pode deixar esse campo vazio e cadastrar o serviço normalmente.
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4" />
            {isSubmitting ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar serviço"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/servicos">Cancelar</Link>
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
