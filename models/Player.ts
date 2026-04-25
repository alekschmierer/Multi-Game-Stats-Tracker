export interface COCPlayer {
  _id: string;
  name: string;
  trophies: number;
  leagueTier: string;
  builderBaseTrophies: number;
  builderBaseLeague: string;
  warStars: number;
  clanCapitalContributions: number;
  lastUpdated: Date;
}

export function mapApiToCOCPlayerModel(apiData: any): COCPlayer {
  return {
    _id: apiData.tag || '',
    name: apiData.name || '',
    trophies: apiData.trophies || 0,
    leagueTier: apiData.leagueTier?.name || '',
    builderBaseTrophies: apiData.builderBaseTrophies || 0,
    builderBaseLeague: apiData.builderBaseLeague?.name || '',
    warStars: apiData.warStars || 0,
    clanCapitalContributions: apiData.clanCapitalContributions || 0,
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
  lastUpdated: Date;
}

export function mapApiToCRPlayerModel(apiData: any): CRPlayer {
  return {
    _id: apiData.tag || '',
    name: apiData.name || '',
    trophies: apiData.trophies || 0,
    wins: apiData.wins || 0,
    losses: apiData.losses || 0,
    battleCount: apiData.battleCount || 0,
    threeCrownWins: apiData.threeCrownWins || 0,
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
  return {
    _id: apiData.puuid || '',
    leagueId: apiData.leagueId || '',
    tier: apiData.tier || '',
    rank: apiData.rank || '',
    leaguePoints: apiData.leaguePoints || 0,
    wins: apiData.wins || 0,
    losses: apiData.losses || 0,
    lastUpdated: new Date(),
  };
}