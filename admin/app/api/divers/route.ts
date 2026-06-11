import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getJoolanAuth } from "@/lib/joolan-auth";

export async function POST(request: NextRequest) {
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

    const actionMap: Record<string, string> = {
      "import-compteurs-passages": "/import-compteurs-passages.do",
      "import-fournisseurs": "/import-fournisseurs.do",
      "import-min-max": "/import-min-max.do",
      "import-champs-perso": "/import-champs-perso.do",
      "envoyer-message": "/envoyer-message.do",
      "query": "/query.do",
    };

    const endpoint = actionMap[action];

    if (!endpoint) {
      return NextResponse.json(
        { error: `Invalid action for POST /divers: ${action}` },
        { status: 400 }
      );
    }

    const url = `${baseUrl}/api/v2${endpoint}`;
    if (!params['output-format']) params['output-format'] = 'json';

    searchParams.forEach((value, key) => {
      if (key !== "action") params[key] = value;
    });

    let body: any;
    if (request.headers.get("content-type")?.includes("text/plain")) {
      body = await request.text();
    } else {
      body = await request.json().catch(() => ({}));
    }

    const response = await axios.post(url, body, {
      params,
      headers: {
        ...(request.headers.get("content-type") && { "Content-Type": request.headers.get("content-type") })
      },
      timeout: 10000,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`Divers API POST error for action ${request.nextUrl.searchParams.get("action")}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return NextResponse.json(
      {
        error: error.message || "Failed to post divers data",
      },
      { status: error.response?.status || 500 }
    );
  }
}
