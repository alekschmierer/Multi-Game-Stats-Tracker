'use server';

import clientPromise from "@/lib/mongodb";
import { COCPlayer, mapApiToCOCPlayerModel, CRPlayer, mapApiToCRPlayerModel, LoLPlayer, mapApiToLoLPlayerModel} from "@/models/Player";
import { redis } from "./redis";

// MongoDb Uses Collections, similar to Tables, _id is the primary key field 
// await db.collection("players")
// https://www.mongodb.com/docs/mongodb-shell/crud/, CRUD operations for MongoDB on a collection
/*
import clientPromise from "@/lib/mongodb";
const client = await clientPromise;
const db = client.db("friend-stat-tracker");
*/
const CLASH_OF_CLANS_API_TOKEN = process.env.CLASH_OF_CLANS_API_TOKEN;
const CLASH_ROYALE_API_TOKEN = process.env.CLASH_ROYALE_API_TOKEN;
const RIOT_API_KEY = process.env.RIOT_API_KEY;

export async function getPlayerCOCData(prevState: any,formData: FormData){
  const playerTagData = formData.get('playerTag') as string;
  return getPlayerByCOCTag(playerTagData);
}
export async function getPlayerByCOCTag(playerTagData: string) {
  console.time("getPlayer");
  const cachekey = `cocPlayer:${playerTagData}`;
  const cachedData = await redis.get(cachekey);

  if (cachedData) {
    console.timeEnd("getPlayer");
    return { data: JSON.parse(cachedData), error: null, status: 200 };
  }

  // Wait for clientPromise to resolve and get the database instance
  const client = await clientPromise;
  const db = client.db("friend-stat-tracker");

  const playerData = await db.collection<COCPlayer>('cocPlayers').findOne({ _id: playerTagData });
  if (playerData && playerData?.lastUpdated && (Date.now() - playerData.lastUpdated.getTime()) < 24 * 60 * 60 * 1000) {
    await redis.set(cachekey, JSON.stringify(playerData), { EX: 60 * 60 }); // Cache for 1 hour
    return { data: playerData, error: null, status: 200 };
  } 

  // %23 is the URL encoded value for #, which is required for the API call to work
  const encodedplayerTagData = encodeURIComponent(playerTagData)
  try {
    const response = await fetch('https://api.clashofclans.com/v1/players/' + encodedplayerTagData, {
      headers: {
        'Authorization': `Bearer ${CLASH_OF_CLANS_API_TOKEN}` || ''
      }
    });
    const data = await response.json();
    if (!response.ok) {
      return { error: 'Failed to fetch player data', data:data, status: response.status };
    }

    // Store the fetched data in the database with a timestamp, update & insert = upsert
    const cocPlayerData: COCPlayer = mapApiToCOCPlayerModel(data);
    await db.collection<COCPlayer>('cocPlayers').updateOne({ _id: playerTagData }, { $set: cocPlayerData }, { upsert: true });
    await redis.set(cachekey, JSON.stringify(cocPlayerData), { EX: 60 * 60 });
    console.timeEnd("getPlayer");
    return { data: cocPlayerData, tag: playerTagData, error: null, status: response.status };

  } catch (err) {
    return { error: 'An error occurred while fetching player data', details: err };
  }
}

export async function getPlayerCRData(prevState: any,formData: FormData){
  const playerTagData = formData.get('playerTag') as string;

  // Wait for clientPromise to resolve and get the database instance
  const client = await clientPromise;
  const db = client.db("friend-stat-tracker");

  const playerData = await db.collection<CRPlayer>('crPlayers').findOne({ _id: playerTagData });

  // If player data is found in the database and is less than 24 hours old, return it. Otherwise, fetch new data from the API
  if (playerData && playerData?.lastUpdated && (Date.now() - playerData.lastUpdated.getTime()) < 24 * 60 * 60 * 1000) {
    return { data: playerData, tag: playerTagData, error: null, status: 200 };
  } else {
    return getPlayerByCRTag(prevState, playerTagData);
  }
}
export async function getPlayerByCRTag(prevState: any,playerTagData: string) {

  // Wait for clientPromise to resolve and get the database instance
  const client = await clientPromise;
  const db = client.db("friend-stat-tracker");

  // %23 is the URL encoded value for #, which is required for the API call to work
  const encodedplayerTagData = encodeURIComponent(playerTagData)
  try {
    const response = await fetch('https://api.clashroyale.com/v1/players/' + encodedplayerTagData, {
      headers: {
        'Authorization': `Bearer ${CLASH_ROYALE_API_TOKEN}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      return { error: 'Failed to fetch player data', data:data, status: response.status };
    }

    // Store the fetched data in the database with a timestamp, update & insert = upsert
    const crPlayerData: CRPlayer = mapApiToCRPlayerModel(data);
    await db.collection<CRPlayer>('crPlayers').updateOne({ _id: playerTagData }, { $set: crPlayerData }, { upsert: true });
    return { data: crPlayerData, tag: playerTagData, error: null, status: response.status };
  } catch (err) {
    return { error: 'An error occurred while fetching player data', details: err };
  }
}

// This function will only be called by other functions that need this api endpoint data
export async function getPUUIDBySummonerNameTag(prevState: any,playerNameTagData: string) {
  const [summonerName, tag] = playerNameTagData.split('#');

  // Summoner names might contain special characters
  const encodedSummonerName = encodeURIComponent(summonerName);
  const encodedTag = encodeURIComponent(tag);
  const encodedsummonerTagData = `${encodedSummonerName}/${encodedTag}`;

  if (!RIOT_API_KEY) {
    throw new Error("RIOT_API_KEY is not defined");
  }

  try {
    const response = await fetch('https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/' + encodedsummonerTagData, {
      headers: {
        // https://hextechdocs.dev/getting-started-with-the-riot-games-api/
        "X-Riot-Token": RIOT_API_KEY
      }
    });
    const data = await response.json();
    if (!response.ok) {
      return { error: 'Failed to fetch player data', data:data, status: response.status };
    }
    return { data: data, error: null, status: response.status };
  } catch (err) {
    return { error: 'An error occurred while fetching PUUIDBySummonerName', details: err };
  }
}
export async function getPlayerRankedLoLData(prevState: any,formData: FormData) {
  const playerNameTagData = formData.get('playerTag') as string;

  // Retrieve the PUUID using the summoner name and tag
  const puuidData = await getPUUIDBySummonerNameTag(prevState, playerNameTagData);
  if (puuidData.error){return { error: 'Failed to fetch player PUUID data', data:null, status: 500 };}
  if (!RIOT_API_KEY) {throw new Error("RIOT_API_KEY is not defined");}

  const playerPUUID = puuidData.data.puuid;

  // Check database before questioning the API
  const client = await clientPromise;
  const db = client.db("friend-stat-tracker");
  const playerData = await db.collection<LoLPlayer>('lolPlayers').findOne({ _id: playerPUUID });
  // If player data is found in the database and is less than 24 hours old, return it. Otherwise, fetch new data from the API
  if (playerData && playerData?.lastUpdated && (Date.now() - playerData.lastUpdated.getTime()) < 24 * 60 * 60 * 1000) {
    return { data: playerData, tag: playerNameTagData, error: null, status: 200 };
  }
  
  try {
    const response = await fetch('https://na1.api.riotgames.com/lol/league/v4/entries/by-puuid/' + playerPUUID, {
      headers: {
        // https://hextechdocs.dev/getting-started-with-the-riot-games-api/
        "X-Riot-Token": RIOT_API_KEY
      }
    });
    const data = await response.json();
    if (!response.ok) {
      return { error: 'Failed to fetch player data', data:data, status: response.status };
    }

    //Check if data array is empty, this means the player hasn't played any ranked games recently
    if (!data || data.length == 0) {
      return { error: 'Player has not played any ranked games recently', data: null, status: 404 };
    }

    // Store the fetched data in the database with a timestamp, update & insert = upsert
    const lolPlayerData: LoLPlayer = mapApiToLoLPlayerModel(data[0]);
    await db.collection<LoLPlayer>('lolPlayers').updateOne({ _id: playerPUUID }, { $set: lolPlayerData }, { upsert: true });
    return { data: lolPlayerData, tag: playerNameTagData,error: null, status: response.status };
  } catch (err) {
    return { error: 'An error occurred while fetching PlayerLoLData', details: err };
  }
}