import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { Clock3, Plus, Search, Sparkles, Ticket } from "lucide-react";
import { Toaster, toast } from "sonner";

import { useAuth } from "../auth/AuthContext";
import { CrudPagination } from "../components/CrudPagination";
import { EmptyStatePanel, MetricCard, PageShell, SectionCard } from "../components/PageShell";
import { ServiceListCard } from "../components/services/ServiceListCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { formatCurrency } from "../data/services";
import { getApiErrorMessage } from "../lib/api-error";
import { getNextPageAfterDelete } from "../lib/pagination";
import { clearRouteNotice, readRouteNotice } from "../lib/route-notice";
import { createServicesService, type ServiceApiItem } from "../services/services";

const ITEMS_PER_PAGE = 6;

type LoadServicesRequest = {
  authToken: string;
  page: number;
  search: string;
  silent?: boolean;
};

export function Servicos() {
  const { token } = useAuth();
  const location = useLocation();
  const [services, setServices] = useState<ServiceApiItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(true);

  const loadServicesFromApi = async ({ authToken, page, search, silent }: LoadServicesRequest) => {
    const servicesService = createServicesService(authToken);

    if (!silent) {
      setIsLoading(true);
    }

    try {
      const response = await servicesService.list({
        page,
        limit: ITEMS_PER_PAGE,
        search,
      });

      setServices(response.data);
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
    if (!token) {
      setServices([]);
      setTotalItems(0);
      setTotalPages(1);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadCurrentPage = async () => {
      try {
        await loadServicesFromApi({
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

        setServices([]);
        setTotalItems(0);
        setTotalPages(1);
        toast.error(getApiErrorMessage(error, "Nao foi possivel carregar os servicos."));
      }
    };

    void loadCurrentPage();

    return () => {
      isMounted = false;
    };
  }, [currentPage, searchTerm, token]);

  const averageTicket =
    services.length > 0
      ? services.reduce((total, service) => total + service.price, 0) / services.length
      : 0;

  const averageDuration =
    services.length > 0
      ? Math.round(services.reduce((total, service) => total + service.durationMinutes, 0) / services.length)
      : 0;

  const handleDelete = async (serviceId: number) => {
    if (!token) {
      toast.error("Sua sessao expirou. Entre novamente para continuar.");
      return;
    }

    try {
      const servicesService = createServicesService(token);
      const response = await servicesService.remove(serviceId);
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

      await loadServicesFromApi({
        authToken: token,
        page: nextPage,
        search: searchTerm,
        silent: true,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel excluir o servico."));
    }
  };

  return (
    <>
      <PageShell
        eyebrow="Gestao"
        title="Servicos"
        description="Catalogo paginado com criacao, edicao e exclusao em telas separadas."
        actions={
          <Button asChild>
            <Link to="/servicos/novo">
              <Plus className="h-4 w-4" />
              Novo servico
            </Link>
          </Button>
        }
      >
        <div className="metric-grid">
          <MetricCard
            label="Ativos"
            value={String(totalItems)}
            helper="Servicos retornados pela API."
            icon={<Sparkles className="h-5 w-5" />}
          />
          <MetricCard
            label="Ticket medio"
            value={formatCurrency(averageTicket)}
            helper="Media dos precos visiveis nesta pagina."
            icon={<Ticket className="h-5 w-5" />}
            accent="sand"
          />
          <MetricCard
            label="Duracao media"
            value={`${averageDuration} min`}
            helper="Tempo medio dos servicos exibidos agora."
            icon={<Clock3 className="h-5 w-5" />}
            accent="coral"
          />
        </div>

        <SectionCard
          title="Catalogo"
          description="A listagem fica separada do formulario para atender o fluxo completo do CRUD."
          action={
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nome ou categoria"
                className="pl-11"
              />
            </div>
          }
        >
          {isLoading ? (
            <EmptyStatePanel
              icon={<Plus className="h-7 w-7" />}
              title="Carregando servicos"
              description="Buscando o catalogo no backend."
            />
          ) : services.length === 0 ? (
            <EmptyStatePanel
              icon={<Plus className="h-7 w-7" />}
              title={totalItems === 0 ? "Nenhum servico cadastrado" : "Nenhum servico encontrado"}
              description={
                totalItems === 0
                  ? "Cadastre o primeiro servico para montar o catalogo."
                  : "Nenhum servico bate com a busca atual."
              }
              action={
                <Button asChild>
                  <Link to="/servicos/novo">
                    <Plus className="h-4 w-4" />
                    Novo servico
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {services.map((service) => (
                  <ServiceListCard key={service.id} service={service} onDelete={handleDelete} />
                ))}
              </div>

              <CrudPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                visibleItems={services.length}
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
