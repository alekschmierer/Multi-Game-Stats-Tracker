"use client";

import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  ScatterController,
  Tooltip,
  Legend,
  type ChartOptions,
  type Plugin,
} from "chart.js";
import { Scatter } from "react-chartjs-2";
import { gamePalette, ink, seriesColor } from "./chartTheme";
import { metrics, strongestGame } from "./metrics";
import type { PlayerData } from "@/interfaces/interface";

ChartJS.register(LinearScale, PointElement, ScatterController, Tooltip, Legend);

type ScatterPoint = { x: number; y: number; label: string };

// Draws each point's friend name beside its dot — small friend counts make
// direct labels readable instead of forcing every hover to find who's who.
function pointLabelsPlugin(isDark: boolean): Plugin<"scatter"> {
  return {
    id: "pointLabels",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.font = "600 11px system-ui, -apple-system, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillStyle = ink.secondary[isDark ? "dark" : "light"];
      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i);
        if (meta.hidden) return;
        meta.data.forEach((point, j) => {
          const raw = dataset.data[j] as unknown as ScatterPoint;
          if (!raw?.label) return;
          ctx.fillText(raw.label, point.x + 8, point.y);
        });
      });
      ctx.restore();
    },
  };
}

export default function ScatterChart({
  allPlayers,
  isDark,
}: {
  allPlayers: { displayName: string; data: PlayerData }[];
  isDark: boolean;
}) {
  const [xKey, setXKey] = useState("crScore");
  const [yKey, setYKey] = useState("lolScore");

  const xMetric = metrics.find((m) => m.key === xKey)!;
  const yMetric = metrics.find((m) => m.key === yKey)!;

  const { data, options, plugin } = useMemo(() => {
    const byGame: Record<"coc" | "cr" | "lol", ScatterPoint[]> = { coc: [], cr: [], lol: [] };

    for (const p of allPlayers) {
      const x = xMetric.get(p.data);
      const y = yMetric.get(p.data);
      if (x === null || y === null) continue;
      const game = strongestGame(p.data);
      if (!game) continue;
      byGame[game].push({ x, y, label: p.displayName || "Unnamed" });
    }

    const mode = isDark ? "dark" : "light";
    const scatterData = {
      datasets: (["coc", "cr", "lol"] as const)
        .filter((game) => byGame[game].length > 0)
        .map((game) => ({
          label: `Strongest: ${gamePalette[game].label}`,
          data: byGame[game],
          backgroundColor: seriesColor(game, isDark),
          pointRadius: 5,
          pointHoverRadius: 7,
          hitRadius: 10,
        })),
    };

    const scatterOptions: ChartOptions<"scatter"> = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          min: 0,
          max: xMetric.max,
          title: { display: true, text: xMetric.label + (xMetric.suffix ?? ""), color: ink.secondary[mode] },
          grid: { color: ink.gridline[mode] },
          border: { color: ink.baseline[mode] },
          ticks: { color: ink.muted[mode] },
        },
        y: {
          min: 0,
          max: yMetric.max,
          title: { display: true, text: yMetric.label + (yMetric.suffix ?? ""), color: ink.secondary[mode] },
          grid: { color: ink.gridline[mode] },
          border: { color: ink.baseline[mode] },
          ticks: { color: ink.muted[mode] },
        },
      },
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: { color: ink.secondary[mode], usePointStyle: true, boxWidth: 8, boxHeight: 8, padding: 16, font: { weight: 600 } },
        },
        tooltip: {
          backgroundColor: ink.surface[mode],
          titleColor: ink.primary[mode],
          bodyColor: ink.secondary[mode],
          borderColor: ink.border[mode],
          borderWidth: 1,
          padding: 10,
          cornerRadius: 6,
          callbacks: {
            label: (ctx) => {
              const raw = ctx.raw as ScatterPoint;
              return `${raw.label}: ${xMetric.label} ${raw.x}${xMetric.suffix ?? ""}, ${yMetric.label} ${raw.y}${yMetric.suffix ?? ""}`;
            },
          },
        },
      },
    };

    return { data: scatterData, options: scatterOptions, plugin: pointLabelsPlugin(isDark) };
  }, [allPlayers, xMetric, yMetric, isDark]);

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        <MetricSelect label="X axis" value={xKey} onChange={setXKey} />
        <MetricSelect label="Y axis" value={yKey} onChange={setYKey} />
      </div>
      <div className="h-80">
        <Scatter data={data} options={options} plugins={[plugin]} />
      </div>
    </div>
  );
}

function MetricSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2">
      <span className="uppercase tracking-widest font-bold opacity-50">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-border/40 bg-background/50 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20"
      >
        {metrics.map((m) => (
          <option key={m.key} value={m.key}>
            {m.label}
          </option>
        ))}
      </select>
    </label>
  );
}
