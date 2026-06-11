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
        { error: "Action parameter is required (export or pdf)" },
        { status: 400 }
      );
    }

    let url = "";
    if (action === "export") {
      url = `${baseUrl}/api/v2/export-tickets.do`;
    } else if (action === "pdf") {
      url = `${baseUrl}/api/v2/ticket-pdf.do`;
    } else {
      return NextResponse.json(
        { error: "Invalid action for GET" },
        { status: 400 }
      );
    }

    // copy other search params to axios params
    searchParams.forEach((value, key) => {
      if (key !== "action") params[key] = value;
    });

    const response = await axios.get(url, {
      params,
      timeout: 10000,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Tickets API GET error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch tickets data",
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { baseUrl, baseParams: params } = getJoolanAuth();

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    if (!action) {
      return NextResponse.json(
        { error: "Action parameter is required (annulation or import)" },
        { status: 400 }
      );
    }

    let url = "";
    if (action === "annulation") {
      url = `${baseUrl}/api/v2/annulation-ticket.do`;
    } else if (action === "import") {
      url = `${baseUrl}/api/v2/import-tickets.do`;
    } else {
      return NextResponse.json(
        { error: "Invalid action for POST" },
        { status: 400 }
      );
    }

    searchParams.forEach((value, key) => {
      if (key !== "action") params[key] = value;
    });

    const body = await request.json().catch(() => ({}));

    const response = await axios.post(url, body, {
      params,
      timeout: 10000,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Tickets API POST error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return NextResponse.json(
      {
        error: error.message || "Failed to post tickets data",
      },
      { status: error.response?.status || 500 }
    );
  }
}

