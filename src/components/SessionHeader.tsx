import { SessionStats } from "./SessionStats";
import type { SessionStatsDto } from "@/types";

interface SessionHeaderProps {
  stats: SessionStatsDto | null;
}

export function SessionHeader({ stats }: SessionHeaderProps) {
  return (
    <header className="mb-8 space-y-6">
      <h1 className="text-3xl font-bold">Sesja nauki</h1>
      {stats && <SessionStats stats={stats} />}
    </header>
  );
}
