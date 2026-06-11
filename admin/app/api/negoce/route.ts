import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getJoolanAuth } from "@/lib/joolan-auth";

export async function POST(request: NextRequest) {
  try {
    const { baseUrl, baseParams: params } = getJoolanAuth();

    request.nextUrl.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const body = await request.json().catch(() => ({}));
    const url = `${baseUrl}/api/v2/negoce.do`;
    if (!params['output-format']) params['output-format'] = 'json';

    const response = await axios.post(url, body, {
      params,
      timeout: 10000,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Negoce API POST error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return NextResponse.json(
      {
        error: error.message || "Failed to post negoce data",
      },
      { status: error.response?.status || 500 }
    );
  }
}

