"use client";

import { gamePalette, seriesColor, rgba, ink } from "./chartTheme";
import type { PlayerData } from "@/interfaces/interface";

type WinLoss = { wins: number; losses: number } | null | undefined;

function GamePanel({
  game,
  rows,
  isDark,
}: {
  game: "cr" | "lol";
  rows: { name: string; record: WinLoss }[];
  isDark: boolean;
}) {
  const withRecord = rows.filter((r) => r.record);
  if (withRecord.length === 0) {
    return <p className="text-sm text-muted-foreground">No {gamePalette[game].label} records yet.</p>;
  }

  const maxVal = Math.max(10, ...withRecord.flatMap((r) => [r.record!.wins, r.record!.losses])) * 1.1;
  const color = seriesColor(game, isDark);

  return (
    <div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          Wins
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rgba(color, 0.4) }} />
          Losses
        </span>
      </div>
      <div className="space-y-3">
        {withRecord.map(({ name, record }) => {
          const winsPct = (record!.wins / maxVal) * 100;
          const lossesPct = (record!.losses / maxVal) * 100;
          const left = Math.min(winsPct, lossesPct);
          const width = Math.abs(winsPct - lossesPct);
          return (
            <div key={name} className="flex items-center gap-3">
              <div className="w-20 shrink-0 text-sm font-semibold truncate" title={name}>
                {name}
              </div>
              <div className="relative flex-1 h-6">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-border/40" />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full"
                  style={{ left: `${left}%`, width: `${width}%`, backgroundColor: rgba(color, 0.5) }}
                />
                <Dot pct={lossesPct} color={rgba(color, 0.4)} value={record!.losses} title={`${name} losses: ${record!.losses}`} ringColor={ink.surface[isDark ? "dark" : "light"]} />
                <Dot pct={winsPct} color={color} value={record!.wins} title={`${name} wins: ${record!.wins}`} ringColor={ink.surface[isDark ? "dark" : "light"]} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Dot({
  pct,
  color,
  value,
  title,
  ringColor,
}: {
  pct: number;
  color: string;
  value: number;
  title: string;
  ringColor: string;
}) {
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
      style={{ left: `${pct}%` }}
      title={title}
    >
      <span
        className="block w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 0 2px ${ringColor}` }}
      />
      <span className="absolute -top-4 text-[10px] font-bold text-muted-foreground whitespace-nowrap">{value}</span>
    </div>
  );
}

export default function DumbbellChart({
  allPlayers,
  isDark,
}: {
  allPlayers: { displayName: string; data: PlayerData }[];
  isDark: boolean;
}) {
  const crRows = allPlayers.map((p) => ({ name: p.displayName || "Unnamed", record: p.data?.cr as WinLoss }));
  const lolRows = allPlayers.map((p) => ({ name: p.displayName || "Unnamed", record: p.data?.lol as WinLoss }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3">{gamePalette.cr.label}</h4>
        <GamePanel game="cr" rows={crRows} isDark={isDark} />
      </div>
      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3">{gamePalette.lol.label}</h4>
        <GamePanel game="lol" rows={lolRows} isDark={isDark} />
      </div>
    </div>
  );
}
