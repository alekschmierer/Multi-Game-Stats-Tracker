'use server';

const CLASH_OF_CLANS_API_TOKEN = process.env.CLASH_OF_CLANS_API_TOKEN;
const CLASH_ROYALE_API_TOKEN = process.env.CLASH_ROYALE_API_TOKEN;
const RIOT_API_KEY = process.env.RIOT_API_KEY;


export async function getPlayerByCOCTag(prevState: any,formData: FormData) {

  const playerTagData = formData.get('playerTag') as string;
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
    return { data: data, error: null, status: response.status };
  } catch (err) {
    return { error: 'An error occurred while fetching player data', details: err };
  }
}

export async function getPlayerByCRTag(prevState: any,formData: FormData) {

  const playerTagData = formData.get('playerTag') as string;
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
    return { data: data, error: null, status: response.status };
  } catch (err) {
    return { error: 'An error occurred while fetching player data', details: err };
  }
}

export async function getPUUIDBySummonerNameTag(prevState: any,formData: FormData) {

  const playerTagData = formData.get('summonerNameTag') as string;

  // TODO: Add validation to ensure the input is in the correct format (e.g., "SummonerName#Tag")
  const [summonerName, tag] = playerTagData.split('#');


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
    return { error: 'An error occurred while fetching player data', details: err };
  }
}