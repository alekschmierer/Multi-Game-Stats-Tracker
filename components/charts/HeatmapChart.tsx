"use client";

import { getGameScore } from "@/lib/getGameScore";
import { gamePalette, seriesColor, sequentialFill, textOnSequentialFill } from "./chartTheme";
import type { PlayerData } from "@/interfaces/interface";

const games = ["coc", "cr", "lol"] as const;

export default function HeatmapChart({
  allPlayers,
  isDark,
}: {
  allPlayers: { displayName: string; data: PlayerData }[];
  isDark: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate" style={{ borderSpacing: 4 }}>
        <thead>
          <tr>
            <th className="text-left text-xs text-muted-foreground font-normal pb-2 pl-1">Friend</th>
            {games.map((game) => (
              <th key={game} className="text-xs font-bold pb-2 px-2 min-w-[7rem]">
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                  style={{ backgroundColor: seriesColor(game, isDark) }}
                />
                <span className="align-middle">{gamePalette[game].label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allPlayers.map((p) => (
            <tr key={p.displayName}>
              <td className="text-sm font-semibold pl-1 whitespace-nowrap">{p.displayName || "Unnamed"}</td>
              {games.map((game) => {
                const value = getGameScore(game, p.data?.[game]);
                return (
                  <td key={game} className="p-0">
                    <div
                      title={`${p.displayName || "Unnamed"} — ${gamePalette[game].label}: ${value ?? "no data"}`}
                      className="rounded-lg h-12 flex items-center justify-center text-sm font-bold transition-colors"
                      style={{
                        backgroundColor: sequentialFill(game, value, isDark),
                        color: textOnSequentialFill(game, value, isDark),
                      }}
                    >
                      {value ?? "—"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
