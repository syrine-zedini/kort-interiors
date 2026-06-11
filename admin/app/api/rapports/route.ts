import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getJoolanAuth } from "@/lib/joolan-auth";

export async function POST(request: NextRequest) {
  try {
    const { baseUrl, baseParams: params } = getJoolanAuth();

    request.nextUrl.searchParams.forEach((value, key) => {
      if (key !== "action") params[key] = value;
    });

    const body = await request.json().catch(() => ({}));
    const url = `${baseUrl}/api/v2/generation-rapports.do`;

    // Log the exact request being sent for debugging
    console.log("Rapports API request:", { url, params, body });

    // Merge body fields into params (Joolan expects params in URL, not body)
    if (body && typeof body === "object") {
      Object.keys(body).forEach((key) => {
        if (key !== "parametres") {
          params[key] = body[key];
        }
      });
      // Flatten parametres array into params
      if (Array.isArray(body.parametres)) {
        body.parametres.forEach((p: { name: string; value: any }) => {
          if (p.name) params[p.name] = p.value;
        });
      }
    }

    const response = await axios.get(url, {
      params,
      timeout: 15000,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Rapports API POST error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return NextResponse.json(
      {
        error: error.message || "Failed to post rapports data",
      },
      { status: error.response?.status || 500 }
    );
  }
}
