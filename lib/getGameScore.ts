import { isRecord, num, numOr, positiveOr, ratio, str, clamp } from "./safe";

/*
  Turns one game's raw player data into a 0-100 score.

  Returns null - never NaN, never a throw - whenever the data is missing or
  shaped in a way we don't recognise. Callers (StatCard, the leaderboard, every
  chart) already treat null as "no data", so a bad payload shows up as "N/A"
  instead of taking the page down.
*/

// Percent of the League playerbase at or above each tier.
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
  CHALLENGER: 0.02,
};

// Each of these returns a 0..1 weighted score, or null if the data can't carry one.
function clashRoyaleScore(data: Record<string, any>): number {
  const trophies = numOr(data.trophies, 0);

  // The API sends an object here, but older cached documents stored a bare number.
  const seasonResult = data.currentPathOfLegendSeasonResult;
  const leagueNumber = positiveOr(
    isRecord(seasonResult) ? seasonResult.leagueNumber : seasonResult,
    1
  );

  const winRate = ratio(data.wins, data.losses) ?? 0;

  return (
    (trophies / 14000) * 0.4 +
    ((leagueNumber - 1) / 6) * 0.35 +
    winRate * 0.25
  );
}

function clashOfClansScore(data: Record<string, any>): number {
  // leagueTier is a string like "Legend League III"; it can also be missing
  // entirely, or an unmapped object on documents written straight from the API.
  const digits = str(data.leagueTier).replace(/[^0-9]/g, "");
  const leagueTierNumber = digits ? numOr(parseInt(digits, 10), 1) : 1;

  return (
    (numOr(data.townHallLevel, 0) / 18) * 0.05 +
    (leagueTierNumber / 33) * 0.5 +
    Math.min(numOr(data.warStars, 0) / 2000, 1) * 0.15 +
    Math.min(numOr(data.clanCapitalContributions, 0) / 500000, 1) * 0.15 +
    (numOr(data.builderBaseTrophies, 0) / 62000) * 0.15
  );
}

function leagueOfLegendsScore(data: Record<string, any>): number | null {
  const [tier] = str(data.tier).split(" ");
  const position = num(rankPosition[tier.toUpperCase()]);

  // An unranked or unrecognised tier has no percentile, so there's no score to
  // give. Previously this produced NaN and poisoned everything downstream.
  if (position === null) return null;

  const rankScore = 1 - position / 100;
  const winRate = ratio(data.wins, data.losses) ?? 0;

  return rankScore * 0.95 + winRate * 0.05;
}

export function getGameScore(
  type: "cr" | "coc" | "lol",
  data: any
): number | null {
  try {
    if (!isRecord(data)) return null;

    let score: number | null = null;
    if (type === "cr") score = clashRoyaleScore(data);
    else if (type === "coc") score = clashOfClansScore(data);
    else if (type === "lol") score = leagueOfLegendsScore(data);

    if (score === null || !Number.isFinite(score)) return null;

    // Clamped because the charts declare these metrics as 0-100 axes, and an
    // out-of-range account (trophies past the ceiling) shouldn't blow the scale.
    return Math.round(clamp(score, 0, 1) * 100);
  } catch {
    // Nothing a single malformed player document contains is worth a crash.
    return null;
  }
}
