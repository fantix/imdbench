import {getApp} from "@/app";
import {NextRequest, NextResponse} from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, {params}: { params: { query: string } }) {
  let app = getApp(request);
  let limit = request.nextUrl.searchParams.get("limit");
  let number_of_ids = parseInt(limit ?? "1");
  if (isNaN(number_of_ids)) {
    let msg = `invalid "limit": ${limit}`;
    return NextResponse.json({msg}, {status: 400});
  }

  switch (params.query) {
    case "insert_movie":
      return await app.setupInsertMovie();

    case "get_movie":
      return await app.setupGetMovie(number_of_ids);

    case "get_user":
      return await app.setupGetUser(number_of_ids);

    default:
      let msg = `invalid "query": ${params.query}`;
      return NextResponse.json({msg}, {status: 404});
  }
}
