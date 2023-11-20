import {PrismaClient as MySQLClient} from '../prisma/generated/mysql'
import {PrismaClient as PGClient} from '../prisma/generated/pg'
export {Prisma as MySQLPrisma} from '../prisma/generated/mysql'

export const pscale = new MySQLClient({datasources: {db: {url: process.env.pscale_url ?? ""}}});
export const rds = new PGClient({datasources: {db: {url: process.env.rds_url ?? ""}}});
