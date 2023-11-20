import {getPrisma} from "@/app";
import {NextRequest, NextResponse} from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, {params}: { params: { query: string } }) {
  let {client, isPG} = getPrisma(request);
  let limit = request.nextUrl.searchParams.get("limit");
  let number_of_ids = parseInt(limit ?? "1");
  if (isNaN(number_of_ids)) {
    let msg = `invalid "limit": ${limit}`;
    return NextResponse.json({msg}, {status: 400});
  }

  let ids: [{ id: number }];
  switch (params.query) {
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
      ids = await client.$queryRawUnsafe(`
          SELECT id
          FROM persons
          ORDER BY ${isPG ? 'random' : 'RAND'}() LIMIT 4
      `);
      let people = ids.map(x => x.id);
      return NextResponse.json(Array(1000).fill({
        prefix: 'insert_test__',
        people,
      }), {status: 200});

    case "get_movie":
      ids = await client.$queryRawUnsafe(`
          SELECT id
          FROM movies
          ORDER BY ${isPG ? 'random' : 'RAND'}() LIMIT ${number_of_ids}
      `);
      return NextResponse.json(ids.map(x => x.id), {status: 200});

    case "get_user":
      ids = await client.$queryRawUnsafe(`
          SELECT id
          FROM users
          ORDER BY ${isPG ? 'random' : 'RAND'}() LIMIT ${number_of_ids}
      `);
      return NextResponse.json(ids.map(x => x.id), {status: 200});

    default:
      let msg = `invalid "query": ${params.query}`;
      return NextResponse.json({msg}, {status: 404});
  }
}
