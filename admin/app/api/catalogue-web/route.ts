import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getJoolanAuth } from "@/lib/joolan-auth";

export async function GET(request: NextRequest) {
  try {
    const { baseUrl, baseParams: params } = getJoolanAuth();

    request.nextUrl.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    params['output-format'] = 'json';

    const url = `${baseUrl}/api/v2/catalogue-web.do`;

    console.log("[catalogue-web] Calling:", url, "params:", JSON.stringify(params));

    const response = await axios.get(url, {
      params,
      timeout: 15000,
    });

    console.log("[catalogue-web] Success, data type:", typeof response.data);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("[catalogue-web] Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      params: error.config?.params,
    });
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch catalogue web",
        detail: error.response?.data,
        oopusStatus: error.response?.status,
      },
      { status: error.response?.status || 500 }
    );
  }
}

