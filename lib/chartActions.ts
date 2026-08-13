'use server';

import getMongoClient from "@/lib/mongodb";
const RIOT_API_KEY = process.env.RIOT_API_KEY;
import { PlayerData, LobbyPlayer } from "@/interfaces/interface";
import { LoLPlayer} from "@/models/Player";
import { errorMessage } from "./safe";

// Champion Mastery - Doughnut Chart
export async function getChampionMastery(prevState: any,formData: FormData) {

  if (!RIOT_API_KEY) {
    return { data: null, error: "RIOT_API_KEY is missing from .env.local", status: 500 };
  }

  try {
    // Check database before questioning the API
    const client = await getMongoClient();
    const db = client.db("friend-stat-tracker");
    const playerData = await db.collection<LoLPlayer>('lolPlayers').findOne({ /*_id: playerPUUID */});
    // If player data is found in the database and is less than 24 hours old, return it. Otherwise, fetch new data from the API
    if (playerData && playerData?.lastUpdated && (Date.now() - playerData.lastUpdated.getTime()) < 24 * 60 * 60 * 1000) {
      return { data: playerData, error: null, status: 200 };
    }

    const response = await fetch('https://na1.api.riotgames.com/lol/league/v4/entries/by-puuid/' /* + playerPUUID*/, {
      headers: {
        // https://hextechdocs.dev/getting-started-with-the-riot-games-api/
        "X-Riot-Token": RIOT_API_KEY
      }
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return { error: 'Failed to fetch player data', data:data, status: response.status };
    }

    //Check if data array is empty, this means the player hasn't played any ranked games recently
    if (!Array.isArray(data) || data.length === 0) {
      return { error: 'Player has not played any ranked games recently', data: null, status: 404 };
    }

    // Store the fetched data in the database with a timestamp, update & insert = upsert
    return { data, error: null, status: response.status };
  } catch (err) {
    console.error("getChampionMastery failed:", err);
    return { data: null, error: errorMessage(err), status: 500 };
  }
}

// Lol Challenges CategoryPoints - Bar Chart

// Lol Match Data - Lots of Match Data - Maybe a table or something?

//