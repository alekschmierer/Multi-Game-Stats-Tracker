"use client";

import { useEffect, useState } from "react";
import ChartCard from "./ChartCard";
import HeatmapChart from "./HeatmapChart";
import ScatterChart from "./ScatterChart";
import DumbbellChart from "./DumbbellChart";
import type { PlayerData } from "@/interfaces/interface";

type ChartPlayer = { displayName: string; data: PlayerData };

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(query.matches);
    const listener = (e: MediaQueryListEvent) => setIsDark(e.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);
  return isDark;
}

export default function ChartsPanel({ allPlayers }: { allPlayers: ChartPlayer[] }) {
  const isDark = useIsDarkMode();

  if (allPlayers.length === 0) {
    return (
      <div className="flex flex-col items-center space-y-3">
        <p>No charts yet, add a player to the lobby.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 w-full space-y-8">
      <ChartCard title="Score Heatmap" subtitle="Every friend against every game — darker means a higher composite score">
        <HeatmapChart allPlayers={allPlayers} isDark={isDark} />
      </ChartCard>

      <ChartCard title="Cross-Game Explorer" subtitle="Pick any two metrics to see how friends relate to each other">
        <ScatterChart allPlayers={allPlayers} isDark={isDark} />
      </ChartCard>

      <ChartCard title="Win / Loss Record" subtitle="The gap between wins and losses per friend, per game">
        <DumbbellChart allPlayers={allPlayers} isDark={isDark} />
      </ChartCard>
    </div>
  );
}
