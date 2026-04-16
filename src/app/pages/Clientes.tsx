import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { Mail, MessageCircle, Phone, Plus, Search } from "lucide-react";
import { Toaster, toast } from "sonner";

import { useAuth } from "../auth/AuthContext";
import { ClientListItem } from "../components/clients/ClientListItem";
import { CrudPagination } from "../components/CrudPagination";
import { EmptyStatePanel, MetricCard, PageShell, SectionCard } from "../components/PageShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { getApiErrorMessage } from "../lib/api-error";
import { getNextPageAfterDelete } from "../lib/pagination";
import { clearRouteNotice, readRouteNotice } from "../lib/route-notice";
import { createClientsService, type ClientApiItem } from "../services/clients";

const ITEMS_PER_PAGE = 6;

type LoadClientsRequest = {
  authToken: string;
  page: number;
  search: string;
  silent?: boolean;
};

export function Clientes() {
  const { token } = useAuth();
  const location = useLocation();
  const [clients, setClients] = useState<ClientApiItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(true);

  const loadClientsFromApi = async ({ authToken, page, search, silent }: LoadClientsRequest) => {
    const clientsService = createClientsService(authToken);

    if (!silent) {
      setIsLoading(true);
    }

    try {
      const response = await clientsService.list({
        page,
        limit: ITEMS_PER_PAGE,
        search,
      });

      setClients(response.data);
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
      setClients([]);
      setTotalItems(0);
      setTotalPages(1);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadCurrentPage = async () => {
      try {
        await loadClientsFromApi({
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

        setClients([]);
        setTotalItems(0);
        setTotalPages(1);
        toast.error(getApiErrorMessage(error, "Nao foi possivel carregar os clientes."));
      }
    };

    void loadCurrentPage();

    return () => {
      isMounted = false;
    };
  }, [currentPage, searchTerm, token]);

  const clientsWithEmailCount = useMemo(
    () => clients.filter((client) => client.email.trim()).length,
    [clients],
  );

  const handleDelete = async (clientId: number) => {
    if (!token) {
      toast.error("Sua sessao expirou. Entre novamente para continuar.");
      return;
    }

    try {
      const clientsService = createClientsService(token);
      const response = await clientsService.remove(clientId);
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

      await loadClientsFromApi({
        authToken: token,
        page: nextPage,
        search: searchTerm,
        silent: true,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel excluir o cliente."));
    }
  };

  return (
    <>
      <PageShell
        eyebrow="Gestao"
        title="Clientes"
        description="Lista paginada dos clientes cadastrados. Para criar ou editar, use as telas separadas do formulario."
        actions={
          <Button asChild>
            <Link to="/clientes/novo">
              <Plus className="h-4 w-4" />
              Novo cliente
            </Link>
          </Button>
        }
      >
        <div className="metric-grid">
          <MetricCard
            label="Total"
            value={String(totalItems)}
            helper="Clientes retornados pela API."
            icon={<MessageCircle className="h-5 w-5" />}
          />
          <MetricCard
            label="Com e-mail"
            value={String(clientsWithEmailCount)}
            helper="Clientes visiveis nesta pagina com e-mail preenchido."
            icon={<Mail className="h-5 w-5" />}
            accent="sand"
          />
          <MetricCard
            label="Pagina atual"
            value={String(currentPage)}
            helper={`${clients.length} cliente${clients.length === 1 ? "" : "s"} exibido${clients.length === 1 ? "" : "s"} agora.`}
            icon={<Phone className="h-5 w-5" />}
            accent="coral"
          />
        </div>

        <SectionCard
          title="Listagem"
          description="Use a busca para localizar um cliente e abra o formulario proprio para criar ou editar."
          action={
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nome, e-mail ou telefone"
                className="pl-11"
              />
            </div>
          }
        >
          {isLoading ? (
            <EmptyStatePanel
              icon={<MessageCircle className="h-7 w-7" />}
              title="Carregando clientes"
              description="Buscando os registros no backend."
            />
          ) : clients.length === 0 ? (
            <EmptyStatePanel
              icon={<MessageCircle className="h-7 w-7" />}
              title={totalItems === 0 ? "Nenhum cliente cadastrado" : "Nenhum cliente encontrado"}
              description={
                totalItems === 0
                  ? "Cadastre o primeiro cliente para comecar o CRUD dessa area."
                  : "Nenhum registro bate com a busca atual."
              }
              action={
                <Button asChild>
                  <Link to="/clientes/novo">
                    <Plus className="h-4 w-4" />
                    Novo cliente
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid gap-3">
                {clients.map((client) => (
                  <ClientListItem key={client.id} client={client} onDelete={handleDelete} />
                ))}
              </div>

              <CrudPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                visibleItems={clients.length}
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
