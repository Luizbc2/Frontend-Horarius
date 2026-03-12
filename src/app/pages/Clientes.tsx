import { Search, Plus, MessageCircle } from "lucide-react";

import { EmptyStatePanel, MetricCard, PageShell, SectionCard } from "../components/PageShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

type Conversation = {
  id: number;
  name: string;
  time: string;
  lastMessage: string;
};

const stats = [
  { label: "Clientes", value: "0" },
  { label: "Conversas Ativas", value: "0" },
  { label: "Não Lidas", value: "0" },
];

const conversations: Conversation[] = [];

export function Clientes() {
  return (
    <PageShell
      eyebrow="Gestao"
      title="Relacionamento com clientes"
      description="Uma inbox mais limpa para acompanhar conversas, identificar oportunidades de retorno e manter o historico sempre a mao."
      actions={
        <Button>
          <Plus className="h-4 w-4" />
          Novo cliente
        </Button>
      }
    >
      <div className="metric-grid">
        {stats.map((stat, index) => (
          <MetricCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            helper={
              index === 0
                ? "Base atual de clientes cadastrados"
                : index === 1
                  ? "Conversas em andamento na inbox"
                  : "Mensagens aguardando resposta"
            }
            icon={<MessageCircle className="h-5 w-5" />}
            accent={index === 1 ? "sand" : index === 2 ? "coral" : "default"}
          />
        ))}
      </div>

      <SectionCard
        title="Inbox de conversas"
        description="Use a busca para localizar rapidamente um cliente ou abrir o canal ideal para iniciar um novo contato."
        action={
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar conversas" className="pl-11" />
          </div>
        }
      >
        {conversations.length === 0 ? (
          <EmptyStatePanel
            icon={<MessageCircle className="h-7 w-7" />}
            title="Nenhuma conversa ainda"
            description="Quando voce iniciar atendimentos por mensagem, a inbox vai mostrar o historico, horario da ultima interacao e atalhos para continuidade do contato."
            action={
              <Button>
                <Plus className="h-4 w-4" />
                Adicionar cliente
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="flex items-start gap-4 rounded-[1.4rem] border border-white/70 bg-white/60 p-4 shadow-[0_18px_45px_-30px_rgba(73,47,22,0.32)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-primary text-primary-foreground">
                  {conversation.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="truncate text-base font-semibold text-foreground">
                      {conversation.name}
                    </h4>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {conversation.time}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-sm text-muted-foreground">
                    {conversation.lastMessage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </PageShell>
  );
}
