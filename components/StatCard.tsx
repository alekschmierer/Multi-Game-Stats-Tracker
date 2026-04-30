"use client";
import { getGameScore } from "@/lib/getGameScore";

type CardProps = {
    title: string;
    data: any;
    type: 'lol' | 'coc' | 'cr';
};

export default function StatCard({ title, data, type}: CardProps) {
    const score = getGameScore(type, data);
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
                {type === 'coc' && (
                    <>
                        <StatRow label="Town Hall Level" value={data.townHallLevel} />
                        <StatRow label="Trophies" value={data.trophies} />
                        <StatRow label="League Tier" value={data.leagueTier.replace("League", "")} />
                        <StatRow label="War Stars" value={data.warStars} />
                        <StatRow label="Clan Capital Contributions" value={data.clanCapitalContributions} />
                        <StatRow label="Builder Base League" value={data.builderBaseLeague.replace("League", "")} />
                        <StatRow label="Builder Base Trophies" value={data.builderBaseTrophies} />
                    </>
                )}
                {type === 'cr' && (
                    <>
                        <StatRow label="Trophies" value={data.trophies} />
                        <StatRow label="League" value={data.currentPathOfLegendSeasonResult?.leagueNumber || 1} />
                        <StatRow label="Battle Count" value={data.battleCount} />
                        <StatRow label="Three Crown Wins" value={data.threeCrownWins} />
                        <StatRow label="Win Rate" value={`${Math.round((data.wins / (data.wins + data.losses)) * 100)}%`} />
                    </>
                )}
                {type === 'lol' && (
                    <>
                        <StatRow label="Rank" value={`${data.tier} ${data.rank}`} />
                        <StatRow label="Wins" value={data.wins} />
                        <StatRow label="Win Rate" value={`${Math.round((data.wins / (data.wins + data.losses)) * 100)}%`} />
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