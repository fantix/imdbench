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
