import { isRecord, numOr, str } from "@/lib/safe";

/*
  These mappers are the boundary between the raw API payloads and everything else.
  They accept any shape at all - including null - and always return a complete,
  correctly typed document, so nothing downstream has to defend itself against a
  field the API renamed or stopped sending.
*/

export interface COCPlayer {
  _id: string;
  name: string;
  townHallLevel: number;
  trophies: number;
  leagueTier: string;
  builderBaseTrophies: number;
  builderBaseLeague: string;
  warStars: number;
  clanCapitalContributions: number;
  lastUpdated: Date;
}

export function mapApiToCOCPlayerModel(apiData: any): COCPlayer {
  const source = isRecord(apiData) ? apiData : {};

  // leagueTier arrives as { id, name } from the API but as a plain string on
  // documents we already saved, so accept either.
  const leagueName = isRecord(source.leagueTier) ? source.leagueTier.name : source.leagueTier;
  const builderLeagueName = isRecord(source.builderBaseLeague)
    ? source.builderBaseLeague.name
    : source.builderBaseLeague;

  return {
    _id: str(source.tag),
    name: str(source.name),
    townHallLevel: numOr(source.townHallLevel, 0),
    trophies: numOr(source.trophies, 0),
    leagueTier: str(leagueName),
    builderBaseTrophies: numOr(source.builderBaseTrophies, 0),
    builderBaseLeague: str(builderLeagueName),
    warStars: numOr(source.warStars, 0),
    clanCapitalContributions: numOr(source.clanCapitalContributions, 0),
    lastUpdated: new Date(),
  };
}

export interface CRPlayer {
  _id: string;
  name: string;
  trophies: number;
  wins: number;
  losses: number;
  battleCount: number;
  threeCrownWins: number;
  // The API sends an object here; older saved documents hold a bare number.
  currentPathOfLegendSeasonResult: { leagueNumber?: number } | number | null;
  lastUpdated: Date;
}

export function mapApiToCRPlayerModel(apiData: any): CRPlayer {
  const source = isRecord(apiData) ? apiData : {};

  return {
    _id: str(source.tag),
    name: str(source.name),
    trophies: numOr(source.trophies, 0),
    wins: numOr(source.wins, 0),
    losses: numOr(source.losses, 0),
    battleCount: numOr(source.battleCount, 0),
    threeCrownWins: numOr(source.threeCrownWins, 0),
    currentPathOfLegendSeasonResult: source.currentPathOfLegendSeasonResult ?? 1,
    lastUpdated: new Date(),
  };
}

export interface LoLPlayer {
  _id: string;
  leagueId: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  lastUpdated: Date;
}

export function mapApiToLoLPlayerModel(apiData: any): LoLPlayer {
  const source = isRecord(apiData) ? apiData : {};

  return {
    _id: str(source.puuid),
    leagueId: str(source.leagueId),
    tier: str(source.tier),
    rank: str(source.rank),
    leaguePoints: numOr(source.leaguePoints, 0),
    wins: numOr(source.wins, 0),
    losses: numOr(source.losses, 0),
    lastUpdated: new Date(),
  };
}