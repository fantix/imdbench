import {MySQLPrisma, pscale} from "@/app";
import {NextRequest, NextResponse} from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    let params = request.nextUrl.searchParams;
    let source = params.get("source");
    let client;
    let Prisma;
    switch (source) {
        case "pscale":
            client = pscale;
            Prisma = MySQLPrisma;
            break;
        default: {
            return NextResponse.json(
                {msg: `invalid "source": ${source}`},
                {status: 400},
            );
        }
    }
    let table = request.nextUrl.searchParams.get("table");
    if (table === null || !(table in client)) {
        return NextResponse.json(
            {msg: `invalid "table": ${table}`},
            {status: 400},
        );
    }
    let number_of_ids = parseInt(params.get("limit") ?? "1");
    let ids = await client.$queryRaw<[{ id: number }]>`
        SELECT id FROM ${Prisma.raw(table)} ORDER BY RAND() LIMIT ${number_of_ids}`
    return NextResponse.json(ids.map(obj => obj.id), {status: 200});
}
