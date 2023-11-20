import {getFullName, getPrisma} from "@/app";
import {NextRequest, NextResponse} from "next/server";

export const dynamic = 'force-dynamic';

async function insertMovie(client: any, val: { prefix: string, people: [number] }) {
  let num = Math.floor(Math.random() * 1000000);
  let movie = await client.movies.create({
    data: {
      title: val.prefix + num,
      image: val.prefix + 'image' + num + '.jpeg',
      description: val.prefix + 'description' + num,
      year: num,

      directors: {
        create: {person_id: val.people[0]},
      },
      cast: {
        createMany: {
          data: val.people.slice(1).map((x) => ({
            person_id: x,
          })),
        },
      },
    },
    select: {
      id: true,
      title: true,
      image: true,
      description: true,
      year: true,

      directors: {
        select: {
          person: {
            select: {
              id: true,
              first_name: true,
              middle_name: true,
              last_name: true,
              image: true,
            },
          },
        },
      },
      cast: {
        select: {
          person: {
            select: {
              id: true,
              first_name: true,
              middle_name: true,
              last_name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  // move the "person" object one level closer to "directors" and
  // "cast"
  for (let fname of ['directors', 'cast']) {
    movie[fname] = movie[fname].map((rel: any) => {
      return {
        id: rel.person.id,
        full_name: getFullName(rel.person),
        image: rel.person.image,
      };
    });
  }

  return NextResponse.json(movie, {status: 200});
}

export async function POST(request: NextRequest, {params}: { params: { query: string } }) {
  let {client} = getPrisma(request);

  switch (params.query) {
    case "insert_movie":
      return await insertMovie(client, await request.json());

    default:
      let msg = `invalid "query": ${params.query}`;
      return NextResponse.json({msg}, {status: 404});
  }
}
