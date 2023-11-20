import {getFullName, getPrisma} from "@/app";
import {NextRequest, NextResponse} from "next/server";

export const dynamic = 'force-dynamic';

async function getMovie(client: any, id: number) {
  const result = await client.$transaction([
    client.movies.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        image: true,
        title: true,
        year: true,
        description: true,

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
          orderBy: [
            {
              list_order: 'asc',
            },
            {
              person: {
                last_name: 'asc',
              },
            },
          ],
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
          orderBy: [
            {
              list_order: 'asc',
            },
            {
              person: {
                last_name: 'asc',
              },
            },
          ],
        },

        reviews: {
          orderBy: {
            creation_time: 'desc',
          },
          select: {
            id: true,
            body: true,
            rating: true,
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    }),

    client.reviews.aggregate({
      _avg: {
        rating: true,
      },
      where: {
        movie: {
          id: id,
        },
      },
    }),
  ]);

  result[0].avg_rating = result[1]._avg.rating;
  // move the "person" object one level closer to "directors" and
  // "cast"
  for (let fname of ['directors', 'cast']) {
    result[0][fname] = result[0][fname].map((rel: any) => {
      return {
        id: rel.person.id,
        full_name: getFullName(rel.person),
        image: rel.person.image,
      };
    });
  }

  return NextResponse.json(result[0], {status: 200});
}

async function getUser(client: any, id: number) {
  const result = await client.$transaction(async (prisma: any) => {
    let result = await prisma.users.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        image: true,
        reviews: {
          take: 10,
          orderBy: {
            creation_time: 'desc',
          },
          select: {
            id: true,
            body: true,
            rating: true,
            movie: {
              select: {
                id: true,
                image: true,
                title: true,
              },
            },
          },
        },
      },
    });

    let avgRatings = await prisma.reviews.groupBy({
      by: ['movie_id'],
      where: {
        movie_id: {
          in: result.reviews.map((r: any) => r.movie.id),
        },
      },
      _avg: {
        rating: true,
      },
    });

    let avgRatingsMap: any = {};

    for (let m of avgRatings) {
      avgRatingsMap[m.movie_id] = m._avg.rating;
    }

    for (let r of result.reviews) {
      r.movie.avg_rating = avgRatingsMap[r.movie.id];
    }
    result.latest_reviews = result.reviews;
    delete result.reviews;
    return result;
  });

  return NextResponse.json(result, {status: 200});
}

export async function GET(request: NextRequest, {params}: { params: { query: string, id: string } }) {
  let {client} = getPrisma(request);
  let id = parseInt(params.id);

  switch (params.query) {
    case "get_movie":
      return await getMovie(client, id);

    case "get_user":
      return await getUser(client, id);

    default:
      let msg = `invalid "query": ${params.query}`;
      return NextResponse.json({msg}, {status: 404});
  }
}
