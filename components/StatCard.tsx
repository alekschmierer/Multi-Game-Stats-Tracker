"use client";
import { getGameScore } from "@/lib/getGameScore";
import { isRecord, ratio, str } from "@/lib/safe";

type CardProps = {
    title: string;
    data: any;
    type: 'lol' | 'coc' | 'cr';
};

// League names come through as "Legend League III" and we only want the tier part.
// Anything that isn't a string (missing field, or the raw { id, name } object)
// renders as a dash instead of throwing on .replace().
function leagueLabel(value: unknown): string {
    const text = str(value).replace("League", "").trim();
    return text || "—";
}

function winRateLabel(data: any): string {
    const rate = ratio(data?.wins, data?.losses);
    return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}

function statValue(value: unknown): string | number {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const text = str(value);
    return text || "—";
}

export default function StatCard({ title, data, type}: CardProps) {
    const score = getGameScore(type, data);
    const hasData = isRecord(data);

    return (
        <div className="h-full flex-1 border border-border rounded-xl p-5 bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center w-full mb-4">
                <h3 className="font-black uppercase tracking-tight text-sm opacity-70">
                    {title}
                </h3>

                <div className="ml-auto px-2 py-[2px] rounded bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold">
                    {score !== null ? `${score}` : "N/A"}
                </div>
            </div>

            <div className="space-y-3">
                {!hasData && (
                    <p className="text-sm text-muted-foreground">No data for this account yet.</p>
                )}
                {hasData && type === 'coc' && (
                    <>
                        <StatRow label="Town Hall Level" value={statValue(data.townHallLevel)} />
                        <StatRow label="Trophies" value={statValue(data.trophies)} />
                        <StatRow label="League Tier" value={leagueLabel(data.leagueTier)} />
                        <StatRow label="War Stars" value={statValue(data.warStars)} />
                        <StatRow label="Clan Capital Contributions" value={statValue(data.clanCapitalContributions)} />
                        <StatRow label="Builder Base League" value={leagueLabel(data.builderBaseLeague)} />
                        <StatRow label="Builder Base Trophies" value={statValue(data.builderBaseTrophies)} />
                    </>
                )}
                {hasData && type === 'cr' && (
                    <>
                        <StatRow label="Trophies" value={statValue(data.trophies)} />
                        <StatRow label="League" value={statValue(data.currentPathOfLegendSeasonResult?.leagueNumber ?? 1)} />
                        <StatRow label="Battle Count" value={statValue(data.battleCount)} />
                        <StatRow label="Three Crown Wins" value={statValue(data.threeCrownWins)} />
                        <StatRow label="Win Rate" value={winRateLabel(data)} />
                    </>
                )}
                {hasData && type === 'lol' && (
                    <>
                        <StatRow label="Rank" value={statValue([str(data.tier), str(data.rank)].filter(Boolean).join(" "))} />
                        <StatRow label="Wins" value={statValue(data.wins)} />
                        <StatRow label="Win Rate" value={winRateLabel(data)} />
                    </>
                )}
            </div>
        </div>
    );
}

function StatRow({ label, value, color = "" }: { label: string, value: any, color?: string }) {
    return (
        <div className="flex justify-between text-sm border-b border-border/40 pb-1">
            <span className="text-muted-foreground">{label}</span>
            <span className={`font-bold ${color}`}>{value}</span>
        </div>
    );
}
