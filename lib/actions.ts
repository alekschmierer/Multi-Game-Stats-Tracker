'use server';

import getMongoClient from "@/lib/mongodb";
import { COCPlayer, mapApiToCOCPlayerModel, CRPlayer, mapApiToCRPlayerModel, LoLPlayer, mapApiToLoLPlayerModel} from "@/models/Player";
import { redis } from "./redis";
import { errorMessage, isRecord, str } from "./safe";

// MongoDb Uses Collections, similar to Tables, _id is the primary key field
// await db.collection("players")
// https://www.mongodb.com/docs/mongodb-shell/crud/, CRUD operations for MongoDB on a collection

/*
  Every action in here returns the same shape and never throws. Anything that can
  go wrong - a dead database, a rate-limited API, an HTML error page where JSON
  was promised, a tag that isn't a tag - comes back as `error` for the UI to show.

  `error` is always a string: an Error instance can't reliably cross the server
  action boundary, so returning one used to produce a serialization failure on
  top of whatever actually went wrong.
*/
type ActionResult = {
  data: any;
  error: string | null;
  status: number;
  tag?: string;
};

const CLASH_OF_CLANS_API_TOKEN = process.env.CLASH_OF_CLANS_API_TOKEN;
const CLASH_ROYALE_API_TOKEN = process.env.CLASH_ROYALE_API_TOKEN;
const RIOT_API_KEY = process.env.RIOT_API_KEY;

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const HOUR_IN_SECONDS = 60 * 60;

// A game API that accepts the connection and then never answers would otherwise
// hang the request forever, so every outbound call is bounded.
const API_TIMEOUT_MS = 8000;

function timeoutSignal() {
  return AbortSignal.timeout(API_TIMEOUT_MS);
}

// AbortError messages are unhelpful in the UI, so name the culprit.
function describeFetchError(err: unknown, label: string): string {
  if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
    return `${label}: the API didn't respond in time`;
  }
  return errorMessage(err);
}

function ok(data: any, status = 200, tag?: string): ActionResult {
  return { data, error: null, status, tag };
}

// `tag` is echoed back on every result, including failures. GameNameForm uses it
// as the input's defaultValue, and React 19 resets an uncontrolled form after a
// form action runs - so any path that omits the tag silently wipes what the user
// typed. Keeping it means the text survives a cache hit and stays put on error.
function fail(error: string, status = 500, data: any = null, tag?: string): ActionResult {
  return { data, error, status, tag };
}

// Mongo is a cache in front of the APIs, so if it's down we log it and keep going
// on live data rather than failing the request.
async function getDb() {
  try {
    const client = await getMongoClient();
    return client.db("friend-stat-tracker");
  } catch (err) {
    console.error("MongoDB unavailable, continuing without it:", errorMessage(err));
    return null;
  }
}

// A rate-limited or erroring API often replies with HTML, which blows up .json().
async function readJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// Both Supercell APIs put a human-readable explanation in `reason`/`message`.
function apiError(data: any, response: Response, label: string): string {
  const reason = isRecord(data) ? str(data.reason) || str(data.message) : "";
  if (response.status === 404) return `${label}: player not found`;
  if (response.status === 429) return `${label}: rate limited, try again shortly`;
  if (response.status === 403) return `${label}: API key rejected (check .env.local, Supercell keys are IP-locked)`;
  return reason || `${label}: request failed with status ${response.status}`;
}

function isFresh(document: any): boolean {
  const lastUpdated = document?.lastUpdated;
  const time =
    lastUpdated instanceof Date ? lastUpdated.getTime() : new Date(lastUpdated ?? NaN).getTime();
  return Number.isFinite(time) && Date.now() - time < DAY_IN_MS;
}

export async function getPlayerCOCData(prevState: any, formData: FormData) {
  return getPlayerByCOCTag(str(formData?.get('playerTag')));
}

export async function getPlayerByCOCTag(playerTagData: string): Promise<ActionResult> {
  const tag = str(playerTagData).trim();
  if (!tag) return fail("Enter a Clash of Clans player tag", 400);

  const cachekey = `cocPlayer:${tag}`;

  // A cache read can no longer throw, and a corrupt entry counts as a miss.
  const cachedData = await redis.get(cachekey);
  if (cachedData) {
    try {
      return ok(JSON.parse(cachedData), 200, tag);
    } catch {
      console.error("Ignoring unparseable Redis entry for", cachekey);
    }
  }

  try {
    const db = await getDb();

    if (db) {
      const playerData = await db.collection<COCPlayer>('cocPlayers').findOne({ _id: tag });
      if (playerData && isFresh(playerData)) {
        await redis.set(cachekey, JSON.stringify(playerData), { EX: HOUR_IN_SECONDS });
        return ok(playerData, 200, tag);
      }
    }

    if (!CLASH_OF_CLANS_API_TOKEN) {
      return fail("CLASH_OF_CLANS_API_TOKEN is missing from .env.local", 500);
    }

    // %23 is the URL encoded value for #, which is required for the API call to work
    const response = await fetch('https://api.clashofclans.com/v1/players/' + encodeURIComponent(tag), {
      headers: { 'Authorization': `Bearer ${CLASH_OF_CLANS_API_TOKEN}` },
      signal: timeoutSignal()
    });
    const data = await readJson(response);

    if (!response.ok) {
      return fail(apiError(data, response, "Clash of Clans"), response.status, data, tag);
    }
    if (!isRecord(data)) {
      return fail("Clash of Clans: unreadable response", 502, null, tag);
    }

    // Store the fetched data in the database with a timestamp, update & insert = upsert
    const cocPlayerData: COCPlayer = mapApiToCOCPlayerModel(data);
    if (db) {
      await db.collection<COCPlayer>('cocPlayers').updateOne({ _id: tag }, { $set: cocPlayerData }, { upsert: true });
    }
    await redis.set(cachekey, JSON.stringify(cocPlayerData), { EX: HOUR_IN_SECONDS });

    return ok(cocPlayerData, response.status, tag);
  } catch (err) {
    console.error("getPlayerByCOCTag failed:", err);
    return fail(describeFetchError(err, "Clash of Clans"), 500, null, tag);
  }
}

export async function getPlayerCRData(prevState: any, formData: FormData): Promise<ActionResult> {
  const tag = str(formData?.get('playerTag')).trim();
  if (!tag) return fail("Enter a Clash Royale player tag", 400);

  try {
    const db = await getDb();

    // If player data is found in the database and is less than 24 hours old, return it.
    // Otherwise, fetch new data from the API
    if (db) {
      const playerData = await db.collection<CRPlayer>('crPlayers').findOne({ _id: tag });
      if (playerData && isFresh(playerData)) {
        return ok(playerData, 200, tag);
      }
    }
  } catch (err) {
    console.error("Clash Royale cache lookup failed, falling back to the API:", err);
  }

  return getPlayerByCRTag(prevState, tag);
}

export async function getPlayerByCRTag(prevState: any, playerTagData: string): Promise<ActionResult> {
  const tag = str(playerTagData).trim();
  if (!tag) return fail("Enter a Clash Royale player tag", 400);

  try {
    if (!CLASH_ROYALE_API_TOKEN) {
      return fail("CLASH_ROYALE_API_TOKEN is missing from .env.local", 500);
    }

    // %23 is the URL encoded value for #, which is required for the API call to work
    const response = await fetch('https://api.clashroyale.com/v1/players/' + encodeURIComponent(tag), {
      headers: { 'Authorization': `Bearer ${CLASH_ROYALE_API_TOKEN}` },
      signal: timeoutSignal()
    });
    const data = await readJson(response);

    if (!response.ok) {
      return fail(apiError(data, response, "Clash Royale"), response.status, data, tag);
    }
    if (!isRecord(data)) {
      return fail("Clash Royale: unreadable response", 502, null, tag);
    }

    // Store the fetched data in the database with a timestamp, update & insert = upsert
    const crPlayerData: CRPlayer = mapApiToCRPlayerModel(data);

    const db = await getDb();
    if (db) {
      await db.collection<CRPlayer>('crPlayers').updateOne({ _id: tag }, { $set: crPlayerData }, { upsert: true });
    }

    return ok(crPlayerData, response.status, tag);
  } catch (err) {
    console.error("getPlayerByCRTag failed:", err);
    return fail(describeFetchError(err, "Clash Royale"), 500, null, tag);
  }
}

// This function will only be called by other functions that need this api endpoint data
export async function getPUUIDBySummonerNameTag(prevState: any, playerNameTagData: string): Promise<ActionResult> {
  const riotId = str(playerNameTagData).trim();

  // Riot IDs are Name#Tag. Without the guard, a missing '#' produced the literal
  // string "undefined" in the URL and a confusing 400 from Riot.
  const separator = riotId.lastIndexOf('#');
  if (separator <= 0 || separator === riotId.length - 1) {
    return fail("League names look like Name#Tag (for example Faker#KR1)", 400);
  }

  // Summoner names might contain special characters
  const encodedSummonerName = encodeURIComponent(riotId.slice(0, separator));
  const encodedTag = encodeURIComponent(riotId.slice(separator + 1));
  const encodedsummonerTagData = `${encodedSummonerName}/${encodedTag}`;

  if (!RIOT_API_KEY) {
    return fail("RIOT_API_KEY is missing from .env.local", 500);
  }

  try {
    const response = await fetch('https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/' + encodedsummonerTagData, {
      headers: {
        // https://hextechdocs.dev/getting-started-with-the-riot-games-api/
        "X-Riot-Token": RIOT_API_KEY
      },
      signal: timeoutSignal()
    });
    const data = await readJson(response);

    if (!response.ok) {
      // Riot keys are short-lived, so a 401/403 here is usually an expired key.
      if (response.status === 401 || response.status === 403) {
        return fail("Riot API key rejected or expired (development keys last 24 hours)", response.status, data);
      }
      return fail(apiError(data, response, "League"), response.status, data);
    }

    return ok(data, response.status);
  } catch (err) {
    console.error("getPUUIDBySummonerNameTag failed:", err);
    return fail(describeFetchError(err, "League"));
  }
}

export async function getPlayerRankedLoLData(prevState: any, formData: FormData): Promise<ActionResult> {
  const riotId = str(formData?.get('playerTag')).trim();
  if (!riotId) return fail("Enter a League name as Name#Tag", 400);

  try {
    // Retrieve the PUUID using the summoner name and tag
    const puuidData = await getPUUIDBySummonerNameTag(prevState, riotId);
    if (puuidData.error) return fail(puuidData.error, puuidData.status, null, riotId);

    const playerPUUID = isRecord(puuidData.data) ? str(puuidData.data.puuid) : "";
    if (!playerPUUID) {
      return fail("League: account found but no PUUID was returned", 502, null, riotId);
    }

    if (!RIOT_API_KEY) {
      return fail("RIOT_API_KEY is missing from .env.local", 500);
    }

    // Check database before questioning the API
    const db = await getDb();
    if (db) {
      const playerData = await db.collection<LoLPlayer>('lolPlayers').findOne({ _id: playerPUUID });
      // If player data is found in the database and is less than 24 hours old, return it.
      // Otherwise, fetch new data from the API
      if (playerData && isFresh(playerData)) {
        return ok(playerData, 200, riotId);
      }
    }

    const response = await fetch('https://na1.api.riotgames.com/lol/league/v4/entries/by-puuid/' + encodeURIComponent(playerPUUID), {
      headers: {
        // https://hextechdocs.dev/getting-started-with-the-riot-games-api/
        "X-Riot-Token": RIOT_API_KEY
      },
      signal: timeoutSignal()
    });
    const data = await readJson(response);

    if (!response.ok) {
      return fail(apiError(data, response, "League"), response.status, data, riotId);
    }

    // Check if data array is empty, this means the player hasn't played any ranked games recently
    if (!Array.isArray(data) || data.length === 0) {
      return fail("Player has not played any ranked games recently", 404, null, riotId);
    }
    if (!isRecord(data[0])) {
      return fail("League: unreadable ranked entry", 502, null, riotId);
    }

    // Store the fetched data in the database with a timestamp, update & insert = upsert
    const lolPlayerData: LoLPlayer = mapApiToLoLPlayerModel(data[0]);
    if (db) {
      await db.collection<LoLPlayer>('lolPlayers').updateOne({ _id: playerPUUID }, { $set: lolPlayerData }, { upsert: true });
    }

    return ok(lolPlayerData, response.status, riotId);
  } catch (err) {
    console.error("getPlayerRankedLoLData failed:", err);
    return fail(describeFetchError(err, "League"), 500, null, riotId);
  }
}
