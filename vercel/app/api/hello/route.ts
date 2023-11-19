import {pscale} from "@/app";

export const dynamic = 'force-dynamic';

interface QueryResult {
    time: Date;
}

export async function GET(request: Request) {
    let result = await pscale.$queryRaw<QueryResult[]>`SELECT now() as time`;
    return new Response(`PlanetScale time: ${result[0].time}`, {
        status: 200,
    });
}
