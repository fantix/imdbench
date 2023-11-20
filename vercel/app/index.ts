import {Prisma as MySQLPrisma, PrismaClient as MySQLClient} from '../prisma/generated/mysql'
import {Prisma as PGPrisma, PrismaClient as PGClient} from '../prisma/generated/pg'
import {NextRequest} from "next/server";


export function getPrisma(request: NextRequest) {
    let source = request.nextUrl.searchParams.get("source");
    switch (source) {
        case "pscale":
            const pscale = new MySQLClient({datasources: {db: {url: process.env.pscale_url ?? ""}}});
            return [pscale, MySQLPrisma];
        case "rds":
            const rds = new PGClient({datasources: {db: {url: process.env.rds_url ?? ""}}});
            return [rds, PGPrisma];
        default: {
            throw new Error(`invalid "source": ${source}`);
        }
    }
}
