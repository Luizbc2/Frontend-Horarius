import { Edit, Trash2 } from "lucide-react";
import { Link } from "react-router";

import { formatCurrency } from "../../data/services";
import { Button } from "../ui/button";

type ServiceListView = {
  id: number;
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
  description: string;
};

type ServiceListCardProps = {
  service: ServiceListView;
  onDelete: (serviceId: number) => void;
};

export function ServiceListCard({ service, onDelete }: ServiceListCardProps) {
  return (
    <article className="rounded-[1.6rem] border border-white/70 bg-white/64 p-5 shadow-[0_22px_52px_-34px_rgba(73,47,22,0.34)]">
      <div className="flex items-start justify-between gap-3">
        <span className="soft-badge" data-variant="warm">
          {service.category}
        </span>
        <span className="data-pill text-xs uppercase tracking-[0.18em]">
          {service.durationMinutes} min
        </span>
      </div>

      <h3 className="mt-5 text-2xl text-foreground">{service.name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>

      <div className="mt-5 space-y-3">
        <div className="data-pill justify-between">
          <span className="text-muted-foreground">Preço</span>
          <span className="font-semibold text-foreground">{formatCurrency(service.price)}</span>
        </div>
      </div>

      <div className="mt-6 flex gap-2 border-t border-[rgba(74,52,34,0.08)] pt-4">
        <Button variant="outline" className="flex-1" asChild>
          <Link to={`/servicos/${service.id}/editar`} state={{ service }}>
            <Edit className="h-4 w-4" />
            Editar
          </Link>
        </Button>
        <Button
          variant="outline"
          className="flex-1 text-destructive hover:text-destructive"
          onClick={() => onDelete(service.id)}
        >
          <Trash2 className="h-4 w-4" />
          Excluir
        </Button>
      </div>
    </article>
  );
}
