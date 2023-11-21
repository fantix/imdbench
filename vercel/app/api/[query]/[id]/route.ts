import {getApp, queries} from "@/app";
import {NextRequest, NextResponse} from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, {params}: { params: { query: string, id: string } }) {
  let app = getApp(request);
  let id = parseInt(params.id);

  for (const {slug, method, run} of queries) {
    if (params.query == slug && method == 'get') {
      return await (app[run] as any)(id);
    }
  }
  let msg = `invalid "query": ${params.query}`;
  return NextResponse.json({msg}, {status: 404});
}
