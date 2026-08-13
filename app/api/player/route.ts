//http://localhost:3000/api/player?playerTag
// Clash Royale and Clash of Clans can use this route as they have the same playerTag format
import { getPlayerByCOCTag } from "@/lib/actions";

export async function GET(request: Request) {
    try {
        const {searchParams} = new URL(request.url);
        const tag = searchParams.get("playerTag");

        if (!tag) {
            return Response.json({error: "Tag is missing from search parameters"}, {status: 400});
        }

        const result = await getPlayerByCOCTag(tag);
        return Response.json(result, { status: result.error ? result.status : 200 });
    } catch (err: any) {
        // The action handles its own failures, so this is only for anything
        // unexpected - the route still answers with JSON instead of a 500 page.
        console.error("/api/player failed:", err);
        return Response.json({ data: null, error: err?.message ?? "Unexpected error" }, { status: 500 });
    }
}
