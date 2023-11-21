import {getApp, queries} from "@/app";
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

  for (const {slug, setup} of queries) {
    if (params.query == slug) {
      return await (app[setup] as any)(number_of_ids);
    }
  }
}
