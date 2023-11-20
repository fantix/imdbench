import {getPrisma} from "@/app";
import {NextRequest, NextResponse} from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    let client;
    try {
        [client] = getPrisma(request);
    } catch (e) {
        if (e instanceof Error) {
            return NextResponse.json({msg: e.message}, {status: 400});
        } else {
            throw e;
        }
    }

    let params = request.nextUrl.searchParams;
    let query = params.get("query");
    switch (query) {
        case "insert_movie":
            await client.$executeRaw`
                DELETE D FROM
                    directors as D
                JOIN
                    movies as M
                ON
                    D.movie_id = M.id
                WHERE
                    M.image LIKE 'insert_test__%';
            `;
            await client.$executeRaw`
                DELETE A FROM
                    actors as A
                JOIN
                    movies as M
                ON
                    A.movie_id = M.id
                WHERE
                    M.image LIKE 'insert_test__%';
            `;
            await client.$executeRaw`
                DELETE FROM
                    movies as M
                WHERE
                    M.image LIKE 'insert_test__%';
            `;
            await client.$executeRaw`
                DELETE FROM
                    persons as P
                WHERE
                    P.image LIKE 'insert_test__%';
            `;
            return NextResponse.json({}, {status: 200});
        default:
            let msg = `invalid "query": ${query}`;
            return NextResponse.json({msg}, {status: 400});
    }
}
