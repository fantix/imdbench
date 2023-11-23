import {getApp, queries} from "@/app";
import {NextRequest, NextResponse} from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, {params}: { params: { query: string } }) {
  let app = getApp(request);

  const {method, run} = queries[params.query as keyof typeof queries];
  if (method == 'post') {
    return await (app[run] as any)(await request.json());
  } else {
    let msg = `invalid "query": ${params.query}`;
    return NextResponse.json({msg}, {status: 404});
  }
}
