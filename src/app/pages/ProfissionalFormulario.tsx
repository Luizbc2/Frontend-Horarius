import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router";

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
import { formatPhone, normalizePhone } from "../data/clients";
import {
  createProfessional,
  getProfessionalById,
  updateProfessional,
  validateProfessionalForm,
  type ProfessionalFormData,
  type ProfessionalFormErrors,
} from "../data/professionals";

const initialFormData: ProfessionalFormData = {
  name: "",
  email: "",
  phone: "",
  specialty: "",
  status: "ativo",
};

export function ProfissionalFormulario() {
  const navigate = useNavigate();
  const params = useParams();
  const professionalId = params.professionalId ? Number(params.professionalId) : null;
  const existingProfessional = useMemo(
    () => (professionalId === null ? null : getProfessionalById(professionalId)),
    [professionalId],
  );
  const [formData, setFormData] = useState<ProfessionalFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<ProfessionalFormErrors>({});

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

  if (isEditing && !existingProfessional) {
    return <Navigate to="/profissionais" replace />;
  }

  const handleChange = (field: keyof ProfessionalFormData, value: string) => {
    setFormData((currentData) => ({
      ...currentData,
      [field]: field === "phone" ? normalizePhone(value) : value,
    }));

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateProfessionalForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    if (isEditing && professionalId !== null) {
      updateProfessional(professionalId, formData);
      navigate("/profissionais", {
        replace: true,
        state: { notice: "Profissional atualizado com sucesso." },
      });
      return;
    }

    createProfessional(formData);
    navigate("/profissionais", {
      replace: true,
      state: { notice: "Profissional cadastrado com sucesso." },
    });
  };

  const hasErrors = Object.keys(formErrors).length > 0;

  return (
    <PageShell
      eyebrow="Profissionais"
      title={isEditing ? "Editar profissional" : "Novo profissional"}
      description="Cadastre os dados principais do profissional. Os horários serão configurados em uma etapa separada."
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
        {hasErrors ? (
          <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
            <AlertTitle>Formulário inválido</AlertTitle>
            <AlertDescription>Revise os campos marcados antes de salvar.</AlertDescription>
          </Alert>
        ) : null}

        <SectionCard
          title="Dados do profissional"
          description="Preencha os dados principais agora. Depois você poderá configurar os horários de trabalho separadamente."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="professional-name">Nome</label>
              <Input
                id="professional-name"
                value={formData.name}
                onChange={(event) => handleChange("name", event.target.value)}
                aria-invalid={Boolean(formErrors.name)}
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
          <Button type="submit">
            <Save className="h-4 w-4" />
            {isEditing ? "Salvar alterações" : "Cadastrar profissional"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/profissionais">Cancelar</Link>
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
