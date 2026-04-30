export function getGameScore(type: "cr" | "coc" | 'lol', data: any): number | null {
    if (!data) return null;

    if (type === "cr") {
        const totalGames = data.wins + data.losses;

        return Math.round(
            (
                (data.trophies / 14000) * 0.4 +
                (((data.currentPathOfLegendSeasonResult?.leagueNumber || 1) - 1) / 6) * 0.35 +
                (totalGames ? data.wins / totalGames : 0) * 0.25
            ) * 100
        );
    }

    if (type === "coc") {
        const cleaned = data.leagueTier.replace(/[^0-9]/g, "");
        const leagueTierNumber = cleaned ? parseInt(cleaned, 10) : 1;

        return Math.round(
            (
                (data.townHallLevel / 18) * 0.05 +
                (leagueTierNumber / 33) * 0.50 +
                Math.min(data.warStars / 2000, 1) * 0.15 +
                Math.min(data.clanCapitalContributions / 500000, 1) * 0.15 +
                (data.builderBaseTrophies / 62000) * 0.15
            ) * 100
        );
    }

    if (type === "lol") {
    const [rank] = data.tier.split(" ");

    const rankPosition: Record<string, number> = {
        IRON: 99,
        BRONZE: 89,
        SILVER: 70,
        GOLD: 45,
        PLATINUM: 24,
        EMERALD: 10,
        DIAMOND: 2.5,
        MASTER: 0.54,
        GRANDMASTER: 0.05,
        CHALLENGER: 0.02
    };

    const rankScore = 1 - (rankPosition[rank] / 100);

    const totalGames = data.wins + data.losses;
    const winrate = totalGames ? data.wins / totalGames : 0;

    return Math.round(
        (rankScore * 0.95 + winrate * 0.05) * 100
    );
}

    return null;
}