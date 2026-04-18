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
import { getNextPageAfterDelete } from "../lib/pagination";
import { clearRouteNotice, readRouteNotice } from "../lib/route-notice";
import { createProfessionalsService } from "../services/professionals";

const ITEMS_PER_PAGE = 6;

type LoadProfessionalsRequest = {
  authToken: string;
  page: number;
  search: string;
  silent?: boolean;
};

export function Profissionais() {
  const { token, user } = useAuth();
  const location = useLocation();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfessionalsFromApi = async ({
    authToken,
    page,
    search,
    silent,
  }: LoadProfessionalsRequest) => {
    const professionalsService = createProfessionalsService(authToken);

    if (!silent) {
      setIsLoading(true);
    }

    try {
      const response = await professionalsService.list({
        page,
        limit: ITEMS_PER_PAGE,
        search,
      });

      const syncedProfessionals = syncProfessionalsBaseData(user.id, response.data);

      setProfessionals(syncedProfessionals);
      setCurrentPage(response.page);
      setPageSize(response.limit);
      setTotalItems(response.totalItems);
      setTotalPages(response.totalPages);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const notice = readRouteNotice(location.state);

    if (notice) {
      toast.success(notice);
      clearRouteNotice();
    }
  }, [location.state]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (!token || !user) {
      setProfessionals([]);
      setTotalItems(0);
      setTotalPages(1);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadCurrentPage = async () => {
      try {
        await loadProfessionalsFromApi({
          authToken: token,
          page: currentPage,
          search: searchTerm,
        });

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
        toast.error(getApiErrorMessage(error, "Não foi possível carregar os profissionais."));
      }
    };

    void loadCurrentPage();

    return () => {
      isMounted = false;
    };
  }, [currentPage, searchTerm, token, user]);

  const activeCount = professionals.filter((professional) => professional.status === "ativo").length;
  const configuredScheduleCount = professionals.filter(
    (professional) => getActiveWorkDaysCount(professional) > 0,
  ).length;

  const handleDelete = async (professionalId: number) => {
    if (!token) {
      toast.error("Sua sessão expirou. Entre novamente para continuar.");
      return;
    }

    try {
      const professionalsService = createProfessionalsService(token);
      const response = await professionalsService.remove(professionalId);
      toast.success(response.message);

      const { nextPage } = getNextPageAfterDelete({
        currentPage,
        itemsPerPage: ITEMS_PER_PAGE,
        totalItems,
      });

      if (nextPage !== currentPage) {
        setCurrentPage(nextPage);
        return;
      }

      await loadProfessionalsFromApi({
        authToken: token,
        page: nextPage,
        search: searchTerm,
        silent: true,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível excluir o profissional."));
    }
  };

  return (
    <>
      <PageShell
        eyebrow="Equipe"
        title="Profissionais"
        description="Cadastre sua equipe, acompanhe quem está ativo e ajuste a agenda de cada pessoa com poucos cliques."
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
            label="Equipe cadastrada"
            value={String(totalItems)}
            helper="Profissionais registrados para trabalhar com você."
            icon={<Scissors className="h-5 w-5" />}
          />
          <MetricCard
            label="Em atividade"
            value={String(activeCount)}
            helper="Pessoas com status ativo nesta seleção."
            icon={<Sparkles className="h-5 w-5" />}
            accent="sand"
          />
          <MetricCard
            label="Agenda ajustada"
            value={String(configuredScheduleCount)}
            helper="Profissionais com dias e horários prontos para receber atendimento."
            icon={<Clock3 className="h-5 w-5" />}
            accent="coral"
          />
        </div>

        <SectionCard
          title="Time do salão"
          description="Busque por nome, especialidade ou status para encontrar a pessoa certa mais rápido."
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
              title="Carregando equipe"
              description="Estamos trazendo os profissionais cadastrados."
            />
          ) : professionals.length === 0 ? (
            <EmptyStatePanel
              icon={<Scissors className="h-7 w-7" />}
              title={totalItems === 0 ? "Nenhum profissional cadastrado" : "Nenhum profissional encontrado"}
              description={
                totalItems === 0
                  ? "Cadastre o primeiro profissional para começar a montar sua equipe."
                  : "Ninguém combina com o filtro usado agora."
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
