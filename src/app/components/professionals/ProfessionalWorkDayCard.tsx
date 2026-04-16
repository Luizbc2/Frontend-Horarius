import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock3,
  Coffee,
} from "lucide-react";

import { WEEK_DAY_LABELS, type ProfessionalWorkDay, type WeekDayKey } from "../../data/professionals";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";

type ProfessionalWorkDayCardProps = {
  isBreakOpen: boolean;
  workDay: ProfessionalWorkDay;
  onToggleBreak: (day: WeekDayKey) => void;
  onUpdate: (day: WeekDayKey, updater: (current: ProfessionalWorkDay) => ProfessionalWorkDay) => void;
};

export function ProfessionalWorkDayCard({
  isBreakOpen,
  workDay,
  onToggleBreak,
  onUpdate,
}: ProfessionalWorkDayCardProps) {
  return (
    <div className="rounded-[1.6rem] border border-[rgba(74,52,34,0.12)] bg-white/88 p-5 shadow-[0_16px_40px_-30px_rgba(73,47,22,0.3)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="flex min-w-[10rem] items-center gap-4">
          <span className="h-10 w-1 rounded-full bg-primary/80" />
          <p className="text-2xl font-semibold text-foreground">{WEEK_DAY_LABELS[workDay.day]}</p>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={workDay.enabled}
            onCheckedChange={(checked) =>
              onUpdate(workDay.day, (current) => ({
                ...current,
                enabled: checked,
              }))
            }
            className="h-9 w-14"
          />
        </div>

        <div className="grid flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] md:items-center">
          <div className="relative">
            <Input
              type="time"
              value={workDay.startTime}
              onChange={(event) =>
                onUpdate(workDay.day, (current) => ({
                  ...current,
                  startTime: event.target.value,
                }))
              }
              disabled={!workDay.enabled}
              className="h-14 rounded-full pr-11 text-lg"
            />
            <Clock3 className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          <div className="flex items-center justify-center text-muted-foreground">
            <ArrowRight className="h-5 w-5" />
          </div>

          <div className="relative">
            <Input
              type="time"
              value={workDay.endTime}
              onChange={(event) =>
                onUpdate(workDay.day, (current) => ({
                  ...current,
                  endTime: event.target.value,
                }))
              }
              disabled={!workDay.enabled}
              className="h-14 rounded-full pr-11 text-lg"
            />
            <Clock3 className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={() => onToggleBreak(workDay.day)}
          >
            <Coffee className="h-4 w-4" />
            <span className="sr-only">Ajustar pausa em {WEEK_DAY_LABELS[workDay.day]}</span>
            {isBreakOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isBreakOpen ? (
        <div className="mt-5 border-t border-[rgba(74,52,34,0.12)] pt-5">
          <div className="grid gap-3 md:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,8rem)] md:items-center">
            <div className="flex items-center gap-2 text-base text-muted-foreground">
              <Coffee className="h-4 w-4" />
              Pausa
            </div>

            <div className="relative">
              <Input
                type="time"
                value={workDay.breakStart}
                onChange={(event) =>
                  onUpdate(workDay.day, (current) => ({
                    ...current,
                    breakStart: event.target.value,
                  }))
                }
                disabled={!workDay.enabled}
                className="h-14 rounded-full pr-11 text-lg"
              />
              <Clock3 className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-center text-muted-foreground">
              <ArrowRight className="h-5 w-5" />
            </div>

            <div className="relative">
              <Input
                type="time"
                value={workDay.breakEnd}
                onChange={(event) =>
                  onUpdate(workDay.day, (current) => ({
                    ...current,
                    breakEnd: event.target.value,
                  }))
                }
                disabled={!workDay.enabled}
                className="h-14 rounded-full pr-11 text-lg"
              />
              <Clock3 className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            <p className="text-sm text-muted-foreground">Opcional</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
