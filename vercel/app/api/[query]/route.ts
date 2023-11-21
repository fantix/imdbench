import {getApp} from "@/app";
import {NextRequest, NextResponse} from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, {params}: { params: { query: string } }) {
  let app = getApp(request);

  switch (params.query) {
    case "insert_movie":
      return await app.insertMovie(await request.json());

    default:
      let msg = `invalid "query": ${params.query}`;
      return NextResponse.json({msg}, {status: 404});
  }
}
