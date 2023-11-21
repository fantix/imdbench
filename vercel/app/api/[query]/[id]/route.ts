import {getApp} from "@/app";
import {NextRequest, NextResponse} from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, {params}: { params: { query: string, id: string } }) {
  let app = getApp(request);
  let id = parseInt(params.id);

  switch (params.query) {
    case "get_movie":
      return await app.getMovie(id);

    case "get_user":
      return await app.getUser(id);

    default:
      let msg = `invalid "query": ${params.query}`;
      return NextResponse.json({msg}, {status: 404});
  }
}
