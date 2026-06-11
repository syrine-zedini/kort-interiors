import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getJoolanAuth } from "@/lib/joolan-auth";

export async function GET(request: NextRequest) {
  try {
    const { baseUrl, baseParams: params } = getJoolanAuth();

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action") || "search";

    if (action === "search") {
      const url = `${baseUrl}/api/v2/recherche-clients.do`;
    if (!params['output-format']) params['output-format'] = 'json';

      const response = await axios.post(url, { Search: [] }, {
        params,
        timeout: 10000,
      });

      return NextResponse.json(response.data);
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Client API error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch client data",
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { baseUrl, baseParams: params } = getJoolanAuth();

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action") || "import";

    const body = await request.json().catch(() => ({}));

    if (action === "import") {
      const url = `${baseUrl}/api/v2/import-clients.do`;
    if (!params['output-format']) params['output-format'] = 'json';

      const response = await axios.post(url, body, {
        params,
        timeout: 10000,
      });

      return NextResponse.json(response.data);
    }

    return NextResponse.json(
      { error: "Invalid action for POST" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Client API POST error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return NextResponse.json(
      {
        error: error.message || "Failed to post client data",
      },
      { status: error.response?.status || 500 }
    );
  }
}

