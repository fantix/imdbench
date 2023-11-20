import {Prisma as MySQLPrisma, PrismaClient as MySQLClient} from '../prisma/generated/mysql'
import {Prisma as PGPrisma, PrismaClient as PGClient} from '../prisma/generated/pg'
import {NextRequest} from "next/server";


export function getPrisma(request: NextRequest): { client: any, prisma: any, isPG: boolean } {
  let client;
  let source = request.nextUrl.searchParams.get("source");
  switch (source) {
    case "pscale":
      client = new MySQLClient({datasources: {db: {url: process.env.pscale_url ?? ""}}});
      return {client, prisma: MySQLPrisma, isPG: false};

    case "rds":
      client = new PGClient({datasources: {db: {url: process.env.rds_url ?? ""}}});
      return {client, prisma: PGPrisma, isPG: true};

    default: {
      throw new Error(`invalid "source": ${source}`);
    }
  }
}

export function getFullName(person: any) {
  let fn;
  if (!person.middle_name) {
    fn = `${person.first_name} ${person.last_name}`;
  } else {
    fn = `${person.first_name} ${person.middle_name} ${person.last_name}`;
  }
  return fn;
}
