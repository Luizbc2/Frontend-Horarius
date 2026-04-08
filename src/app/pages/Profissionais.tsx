import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { Clock3, Plus, Scissors, Search, Sparkles } from "lucide-react";
import { Toaster, toast } from "sonner";

import { useAuth } from "../auth/AuthContext";
import { CrudPagination } from "../components/CrudPagination";
import { EmptyStatePanel, MetricCard, PageShell, SectionCard } from "../components/PageShell";
import { ProfessionalListCard } from "../components/professionals/ProfessionalListCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  getActiveWorkDaysCount,
  syncProfessionalsBaseData,
  type Professional,
} from "../data/professionals";
import { getApiErrorMessage } from "../lib/api-error";
import { createProfessionalsService } from "../services/professionals";

const ITEMS_PER_PAGE = 6;

type LocationState = {
  notice?: string;
};

export function Profissionais() {
  const { token } = useAuth();
  const location = useLocation();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfessionalsFromApi = async (
    authToken: string,
    page: number,
    search: string,
    options?: { silent?: boolean },
  ) => {
    const professionalsService = createProfessionalsService(authToken);

    if (!options?.silent) {
      setIsLoading(true);
    }

    try {
      const response = await professionalsService.list({
        page,
        limit: ITEMS_PER_PAGE,
        search,
      });

      const syncedProfessionals = syncProfessionalsBaseData(response.data);

      setProfessionals(syncedProfessionals);
      setCurrentPage(response.page);
      setPageSize(response.limit);
      setTotalItems(response.totalItems);
      setTotalPages(response.totalPages);
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (typeof location.state === "object" && location.state !== null && "notice" in location.state) {
      const state = location.state as LocationState;

      if (state.notice) {
        toast.success(state.notice);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (!token) {
      setProfessionals([]);
      setTotalItems(0);
      setTotalPages(1);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadCurrentPage = async () => {
      try {
        await loadProfessionalsFromApi(token, currentPage, searchTerm);

        if (!isMounted) {
          return;
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setProfessionals([]);
        setTotalItems(0);
        setTotalPages(1);
        toast.error(getApiErrorMessage(error, "Nao foi possivel carregar os profissionais."));
      }
    };

    void loadCurrentPage();

    return () => {
      isMounted = false;
    };
  }, [currentPage, searchTerm, token]);

  const activeCount = professionals.filter((professional) => professional.status === "ativo").length;
  const configuredScheduleCount = professionals.filter(
    (professional) => getActiveWorkDaysCount(professional) > 0,
  ).length;

  const handleDelete = async (professionalId: number) => {
    if (!token) {
      toast.error("Sua sessao expirou. Entre novamente para continuar.");
      return;
    }

    try {
      const professionalsService = createProfessionalsService(token);
      const response = await professionalsService.remove(professionalId);
      toast.success(response.message);

      const nextTotalItems = Math.max(0, totalItems - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotalItems / ITEMS_PER_PAGE));
      const nextPage = Math.min(currentPage, nextTotalPages);

      if (nextPage !== currentPage) {
        setCurrentPage(nextPage);
        return;
      }

      await loadProfessionalsFromApi(token, nextPage, searchTerm, { silent: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel excluir o profissional."));
    }
  };

  return (
    <>
      <PageShell
        eyebrow="Equipe"
        title="Profissionais"
        description="Cadastre sua equipe, ajuste os dados principais e depois organize a jornada de cada profissional."
        actions={
          <Button asChild>
            <Link to="/profissionais/novo">
              <Plus className="h-4 w-4" />
              Novo profissional
            </Link>
          </Button>
        }
      >
        <div className="metric-grid">
          <MetricCard
            label="Total"
            value={String(totalItems)}
            helper="Profissionais retornados pela API."
            icon={<Scissors className="h-5 w-5" />}
          />
          <MetricCard
            label="Ativos"
            value={String(activeCount)}
            helper="Profissionais ativos nesta pagina."
            icon={<Sparkles className="h-5 w-5" />}
            accent="sand"
          />
          <MetricCard
            label="Com horarios"
            value={String(configuredScheduleCount)}
            helper="Profissionais desta pagina com rotina local definida."
            icon={<Clock3 className="h-5 w-5" />}
            accent="coral"
          />
        </div>

        <SectionCard
          title="Equipe"
          description="Os dados principais ficam aqui. Os horarios de trabalho podem ser ajustados depois, profissional por profissional."
          action={
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nome, especialidade ou status"
                className="pl-11"
              />
            </div>
          }
        >
          {isLoading ? (
            <EmptyStatePanel
              icon={<Scissors className="h-7 w-7" />}
              title="Carregando profissionais"
              description="Buscando a equipe no backend."
            />
          ) : professionals.length === 0 ? (
            <EmptyStatePanel
              icon={<Scissors className="h-7 w-7" />}
              title={totalItems === 0 ? "Nenhum profissional cadastrado" : "Nenhum profissional encontrado"}
              description={
                totalItems === 0
                  ? "Cadastre o primeiro profissional para comecar a montar sua equipe."
                  : "Nenhum registro bate com a busca atual."
              }
              action={
                <Button asChild>
                  <Link to="/profissionais/novo">
                    <Plus className="h-4 w-4" />
                    Novo profissional
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {professionals.map((professional) => (
                  <ProfessionalListCard
                    key={professional.id}
                    professional={professional}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              <CrudPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                visibleItems={professionals.length}
                pageSize={pageSize}
                onPrevious={() => setCurrentPage(Math.max(1, currentPage - 1))}
                onNext={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              />
            </>
          )}
        </SectionCard>
      </PageShell>

      <Toaster position="bottom-left" closeButton richColors />
    </>
  );
}
