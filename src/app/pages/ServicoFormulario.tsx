import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router";

import { useAuth } from "../auth/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { PageShell, SectionCard } from "../components/PageShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { validateServiceForm, type ServiceFormData, type ServiceFormErrors } from "../data/services";
import { getApiErrorMessage } from "../lib/api-error";
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
  const existingService = useMemo(
    () => (serviceId === null ? null : locationState?.service ?? null),
    [locationState, serviceId],
  );
  const [formData, setFormData] = useState<ServiceFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<ServiceFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
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

  if (isEditing && !existingService) {
    return <Navigate to="/servicos" replace />;
  }

  const handleChange = (field: keyof ServiceFormData, value: string) => {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
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
      setSubmitError("Sua sessao expirou. Entre novamente para continuar.");
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
          price: Number(formData.price.replace(",", ".")),
          description: formData.description.trim(),
        });

        navigate("/servicos", {
          replace: true,
          state: { notice: response.message },
        });
        return;
      } catch (error) {
        setSubmitError(getApiErrorMessage(error, "Nao foi possivel atualizar o servico."));
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
        price: Number(formData.price.replace(",", ".")),
        description: formData.description.trim(),
      });

      navigate("/servicos", {
        replace: true,
        state: { notice: response.message },
      });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Nao foi possivel cadastrar o servico."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasErrors = Object.keys(formErrors).length > 0;

  return (
    <PageShell
      eyebrow="Servicos"
      title={isEditing ? "Editar servico" : "Novo servico"}
      description="Formulario separado da listagem para manter o CRUD completo."
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
          title="Dados do servico"
          description="Todos os campos sao obrigatorios para o cadastro e edicao."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="service-name">Nome</label>
              <Input
                id="service-name"
                value={formData.name}
                onChange={(event) => handleChange("name", event.target.value)}
                aria-invalid={Boolean(formErrors.name)}
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
              />
              {formErrors.category ? <p className="text-sm text-destructive">{formErrors.category}</p> : null}
            </div>

            <div className="grid gap-2">
              <label htmlFor="service-duration">Duracao (minutos)</label>
              <Input
                id="service-duration"
                type="number"
                min="1"
                value={formData.durationMinutes}
                onChange={(event) => handleChange("durationMinutes", event.target.value)}
                aria-invalid={Boolean(formErrors.durationMinutes)}
              />
              {formErrors.durationMinutes ? (
                <p className="text-sm text-destructive">{formErrors.durationMinutes}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label htmlFor="service-price">Preco</label>
              <Input
                id="service-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(event) => handleChange("price", event.target.value)}
                aria-invalid={Boolean(formErrors.price)}
              />
              {formErrors.price ? <p className="text-sm text-destructive">{formErrors.price}</p> : null}
            </div>

            <div className="grid gap-2 md:col-span-2">
              <label htmlFor="service-description">Descricao</label>
              <Textarea
                id="service-description"
                rows={4}
                value={formData.description}
                onChange={(event) => handleChange("description", event.target.value)}
                aria-invalid={Boolean(formErrors.description)}
              />
              {formErrors.description ? (
                <p className="text-sm text-destructive">{formErrors.description}</p>
              ) : null}
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4" />
            {isSubmitting ? "Salvando..." : isEditing ? "Salvar alteracoes" : "Cadastrar servico"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/servicos">Cancelar</Link>
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
