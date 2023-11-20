import {getPrisma} from "@/app";
import {NextRequest, NextResponse} from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    let client, Prisma;
    try {
        [client, Prisma] = getPrisma(request);
    } catch (e) {
        if (e instanceof Error) {
            return NextResponse.json({msg: e.message}, {status: 400});
        } else {
            throw e;
        }
    }

    let params = request.nextUrl.searchParams;
    let table = params.get("table");
    if (table === null || !(table in client)) {
        let msg = `invalid "table": ${table}`;
        return NextResponse.json({msg}, {status: 400});
    }

    let limit = params.get("limit");
    let number_of_ids = parseInt(limit ?? "1");
    if (isNaN(number_of_ids)) {
        let msg = `invalid "limit": ${limit}`;
        return NextResponse.json({msg}, {status: 400});
    }

    let ids = await client.$queryRaw<[{ id: number }]>`
        SELECT id FROM ${Prisma.raw(table)} ORDER BY RAND() LIMIT ${number_of_ids}`
    return NextResponse.json(ids.map(obj => obj.id), {status: 200});
}
