import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getJoolanAuth } from "@/lib/joolan-auth";

export async function GET(request: NextRequest) {
  try {
    const { baseUrl, baseParams: params } = getJoolanAuth();

    request.nextUrl.searchParams.forEach((value, key) => {
      if (key !== "action") params[key] = value;
    });

    const url = `${baseUrl}/api/v2/planet-pii.do`;
    delete params['output-format']; // Planet PII is an XML export endpoint, it rejects json output format

    const response = await axios.get(url, {
      params,
      timeout: 10000,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Tax-Free API GET error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch tax-free data",
      },
      { status: error.response?.status || 500 }
    );
  }
}
