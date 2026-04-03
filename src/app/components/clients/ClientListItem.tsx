import { Mail, PencilLine, Phone, Trash2 } from "lucide-react";
import { Link } from "react-router";

import { formatPhone } from "../../data/clients";
import { Button } from "../ui/button";

type ClientListView = {
  id: number;
  name: string;
  email: string;
  phone: string;
  notes: string;
  createdAt?: string;
};

type ClientListItemProps = {
  client: ClientListView;
  onDelete: (clientId: number) => void;
};

export function ClientListItem({ client, onDelete }: ClientListItemProps) {
  return (
    <article className="flex flex-col gap-4 rounded-[1.4rem] border border-white/70 bg-white/60 p-4 shadow-[0_18px_45px_-30px_rgba(73,47,22,0.32)] md:flex-row md:items-start">
      <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-primary text-lg font-semibold text-primary-foreground">
        {client.name.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-foreground">{client.name}</h3>
          {client.createdAt ? (
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {new Intl.DateTimeFormat("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }).format(new Date(client.createdAt))}
            </span>
          ) : null}
        </div>

        <p className="mt-2 text-sm text-muted-foreground">{client.notes}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="data-pill text-xs">
            <Mail className="h-3.5 w-3.5" />
            {client.email}
          </span>
          <span className="data-pill text-xs">
            <Phone className="h-3.5 w-3.5" />
            {formatPhone(client.phone)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 md:w-auto md:flex-col">
        <Button asChild variant="outline" size="sm">
          <Link to={`/clientes/${client.id}/editar`}>
            <PencilLine className="h-4 w-4" />
            Editar
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(client.id)}
        >
          <Trash2 className="h-4 w-4" />
          Excluir
        </Button>
      </div>
    </article>
  );
}
