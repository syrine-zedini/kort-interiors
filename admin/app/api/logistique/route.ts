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

    params.action = action;

    const magasin = searchParams.get("Magasin");
    if (magasin) params.Magasin = magasin;
    
    const tarif = searchParams.get("tarif");
    if (tarif) params.tarif = tarif;
    
    const lastChange = searchParams.get("last_change");
    if (lastChange) params.last_change = lastChange;

    const url = `${baseUrl}/api/v2/logistique.do`;
    if (!params['output-format']) params['output-format'] = 'json';
    
    const response = await axios.get(url, {
      params,
      timeout: 10000,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Logistique API error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch logistique data",
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { baseUrl, baseParams: params } = getJoolanAuth();

    const body = await request.json().catch(() => ({}));
    const url = `${baseUrl}/api/v2/logistique.do`;
    if (!params['output-format']) params['output-format'] = 'json';

    const response = await axios.post(url, body, {
      params,
      timeout: 10000,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Logistique API POST error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return NextResponse.json(
      {
        error: error.message || "Failed to post logistique data",
      },
      { status: error.response?.status || 500 }
    );
  }
}

