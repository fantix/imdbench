import {NextRequest} from "next/server";
import {PrismaApp} from "@/app/prisma";
import {App} from "@/app/app";

let clients: { [key: string]: App } = {};
const settings = [
  {
    name: "PlanetScale with Prisma",
    db: "pscale",
    app: "prisma",
    factory: PrismaApp,
    env: "pscale_url",
  },
  {
    name: "AWS RDS with Prisma",
    db: "rds",
    app: "prisma",
    factory: PrismaApp,
    env: "rds_url",
  },
]
export const queries = [
  {
    slug: "insert_movie",
    setup: "setupInsertMovie" as keyof App,
    run: "insertMovie" as keyof App,
    method: "post",
  },
  {
    slug: "get_movie",
    setup: "setupGetMovie" as keyof App,
    run: "getMovie" as keyof App,
    method: "get",
  },
  {
    slug: "get_user",
    setup: "setupGetUser" as keyof App,
    run: "getUser" as keyof App,
    method: "get",
  },
]

export function getApp(request: NextRequest): App {
  const params = request.nextUrl.searchParams;
  const db = params.get("db");
  const app = params.get("app");
  const key = `${db}/${app}`;
  let rv = clients[key];
  if (rv === undefined) {
    for (const setting of settings) {
      if (setting.db == db && setting.app == app) {
        rv = new setting.factory(process.env[setting.env]!);
        clients[key] = rv;
        return rv;
      }
    }
    throw new Error(`invalid db/app: ${key}`);
  } else {
    return rv;
  }
}

export function listSettings() {
  return settings.map(function ({name, db, app, env}) {
    let bootstrapped = env in process.env;
    return {name, db, app, bootstrapped}
  })
}
