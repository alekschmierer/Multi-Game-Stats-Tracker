import { getGameScore } from "@/lib/getGameScore";
import type { PlayerData } from "@/interfaces/interface";

export type Metric = {
  key: string;
  label: string;
  suffix?: string;
  max?: number;
  get: (data: PlayerData) => number | null;
};

function winRate(d: { wins: number; losses: number } | null | undefined) {
  if (!d) return null;
  const total = d.wins + d.losses;
  return total ? Math.round((d.wins / total) * 100) : 0;
}

export const metrics: Metric[] = [
  { key: "cocScore", label: "Clash of Clans Score", max: 100, get: (d) => getGameScore("coc", d.coc) },
  { key: "crScore", label: "Clash Royale Score", max: 100, get: (d) => getGameScore("cr", d.cr) },
  { key: "lolScore", label: "League of Legends Score", max: 100, get: (d) => getGameScore("lol", d.lol) },
  { key: "cocTrophies", label: "COC Trophies", get: (d) => d.coc?.trophies ?? null },
  { key: "crTrophies", label: "CR Trophies", get: (d) => d.cr?.trophies ?? null },
  { key: "crWinRate", label: "CR Win Rate", suffix: "%", max: 100, get: (d) => winRate(d.cr) },
  { key: "lolWinRate", label: "LoL Win Rate", suffix: "%", max: 100, get: (d) => winRate(d.lol) },
  { key: "cocWarStars", label: "COC War Stars", get: (d) => d.coc?.warStars ?? null },
  { key: "cocTownHall", label: "COC Town Hall", get: (d) => d.coc?.townHallLevel ?? null },
];

export function strongestGame(data: PlayerData): "coc" | "cr" | "lol" | null {
  const scores: Array<["coc" | "cr" | "lol", number | null]> = [
    ["coc", getGameScore("coc", data.coc)],
    ["cr", getGameScore("cr", data.cr)],
    ["lol", getGameScore("lol", data.lol)],
  ];
  const withScore = scores.filter((s): s is [typeof s[0], number] => s[1] !== null);
  if (withScore.length === 0) return null;
  return withScore.reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0];
}
