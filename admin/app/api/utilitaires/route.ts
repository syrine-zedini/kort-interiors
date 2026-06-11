import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getJoolanAuth } from "@/lib/joolan-auth";

export async function GET(request: NextRequest) {
  try {
    const { baseUrl, baseParams: params } = getJoolanAuth();

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    if (!action) {
      return NextResponse.json(
        { error: "Action parameter is required" },
        { status: 400 }
      );
    }

    let endpoint = "";
    if (action === "ean-existe") {
      endpoint = "/ean-existe.do";
    } else {
      return NextResponse.json(
        { error: "Invalid action for utilitaires" },
        { status: 400 }
      );
    }

    searchParams.forEach((value, key) => {
      if (key !== "action") params[key] = value;
    });

    const url = `${baseUrl}/api/v2${endpoint}`;
    if (!params['output-format']) params['output-format'] = 'json';

    const response = await axios.get(url, {
      params,
      timeout: 10000,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch utilitaire data",
      },
      { status: error.response?.status || 500 }
    );
  }
}
