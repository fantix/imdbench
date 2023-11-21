import {PrismaClient as MySQLClient} from '../prisma/generated/mysql'
import {PrismaClient as PGClient} from '../prisma/generated/pg'
import {NextResponse} from "next/server";
import {App} from "@/app/app";

export class PrismaApp extends App {
  private readonly client: any;
  private readonly isPG: boolean;

  constructor(url: string) {
    super();
    if (url.startsWith("mysql")) {
      this.client = new MySQLClient({datasources: {db: {url}}});
      this.isPG = false;
    } else {
      this.client = new PGClient({datasources: {db: {url}}});
      this.isPG = true;
    }
  }

  async setupInsertMovie(number_of_ids: number) {
    await this.client.$executeRaw`
        DELETE D FROM
            directors as D
        JOIN
            movies as M
        ON
            D.movie_id = M.id
        WHERE
            M.image LIKE 'insert_test__%';
    `;
    await this.client.$executeRaw`
        DELETE A FROM
            actors as A
        JOIN
            movies as M
        ON
            A.movie_id = M.id
        WHERE
            M.image LIKE 'insert_test__%';
    `;
    await this.client.$executeRaw`
        DELETE FROM
            movies as M
        WHERE
            M.image LIKE 'insert_test__%';
    `;
    await this.client.$executeRaw`
        DELETE FROM
            persons as P
        WHERE
            P.image LIKE 'insert_test__%';
    `;
    const ids: [{ id: number }] = await this.client.$queryRawUnsafe(`
        SELECT id
        FROM persons
        ORDER BY ${this.isPG ? 'random' : 'RAND'}() LIMIT 4
    `);
    let people = ids.map(x => x.id);
    return NextResponse.json(Array(number_of_ids).fill({
      prefix: 'insert_test__',
      people,
    }) as any, {status: 200});
  }

  async insertMovie(val: { prefix: string, people: [number] }) {
    let num = Math.floor(Math.random() * 1000000);
    let movie = await this.client.movies.create({
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
          full_name: this.getFullName(rel.person),
          image: rel.person.image,
        };
      });
    }

    return NextResponse.json(movie, {status: 200});
  }

  async setupGetMovie(number_of_ids: number) {
    const ids: [{ id: number }] = await this.client.$queryRawUnsafe(`
          SELECT id
          FROM movies
          ORDER BY ${this.isPG ? 'random' : 'RAND'}() LIMIT ${number_of_ids}
      `);
    return NextResponse.json(ids.map(x => x.id) as any, {status: 200});
  }

  async getMovie(id: number) {
    const result = await this.client.$transaction([
      this.client.movies.findUnique({
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

      this.client.reviews.aggregate({
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
          full_name: this.getFullName(rel.person),
          image: rel.person.image,
        };
      });
    }

    return NextResponse.json(result[0], {status: 200});
  }

  async setupGetUser(number_of_ids: number) {
    const ids: [{ id: number }] = await this.client.$queryRawUnsafe(`
          SELECT id
          FROM users
          ORDER BY ${this.isPG ? 'random' : 'RAND'}() LIMIT ${number_of_ids}
      `);
    return NextResponse.json(ids.map(x => x.id) as any, {status: 200});
  }

  async getUser(id: number) {
    const result = await this.client.$transaction(async (prisma: any) => {
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
}
