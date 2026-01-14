import { Clock, Plus, CheckCircle } from "lucide-react";
import type { SessionStatsDto } from "@/types";

interface SessionStatsProps {
  stats: SessionStatsDto;
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string;
}

function StatItem({ icon, label, value, colorClass }: StatItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
      <div className={`flex-shrink-0 ${colorClass}`} aria-hidden="true">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-2xl font-bold" aria-label={`${value} ${label}`}>
          {value}
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export function SessionStats({ stats }: SessionStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatItem
        icon={<Clock className="h-6 w-6" />}
        label="Do powtórki"
        value={stats.due_count}
        colorClass="text-orange-500"
      />
      <StatItem icon={<Plus className="h-6 w-6" />} label="Nowe" value={stats.new_count} colorClass="text-blue-500" />
      <StatItem
        icon={<CheckCircle className="h-6 w-6" />}
        label="Wyuczone"
        value={stats.learned_count}
        colorClass="text-green-500"
      />
    </div>
  );
}
