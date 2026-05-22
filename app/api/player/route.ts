//http://localhost:3000/api/player?playerTag
// Clash Royale and Clash of Clans can use this route as they have the same playerTag format
import { getPlayerByCOCTag } from "@/lib/actions";
import { redis } from "@/lib/redis";

export async function GET(request: Request) {
    const {searchParams} = new URL(request.url);
    const tag = searchParams.get("playerTag");

    if (!tag) {
        return Response.json({error: "Tag is missing from serarch paramters"}, {status: 400});
    }

    const result = await getPlayerByCOCTag(tag);
    return Response.json(result);
}
