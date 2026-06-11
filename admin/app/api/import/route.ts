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
      "produits": "/import-produits.do",
      "tarifs": "/import-tarifs.do",
      "produits-associes": "/import-produits-associes.do",
      "receptions": "/import-receptions.do",
      "transferts": "/import-transferts.do",
      "bl-fournisseur": "/import-bl-fournisseur.do",
      "commandes-fournisseurs": "/import-commandes-fournisseurs.do",
            "image-stock": "/import-image-stock.do",
      "associer-receptions-commandes": "/associer-receptions-commandes.do"

    };

    const endpoint = actionMap[action];

    if (!endpoint) {
      return NextResponse.json(
        { error: "Invalid action for POST /import" },
        { status: 400 }
      );
    }

    const url = `${baseUrl}/api/v2${endpoint}`;
    if (!params['output-format']) params['output-format'] = 'json';

    searchParams.forEach((value, key) => {
      if (key !== "action") params[key] = value;
    });

    const body = await request.json().catch(() => ({}));

    const response = await axios.post(url, body, {
      params,
      timeout: 15000, // Imports might take longer
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`Import API POST error for action ${request.nextUrl.searchParams.get("action")}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return NextResponse.json(
      {
        error: error.message || "Failed to post import data",
      },
      { status: error.response?.status || 500 }
    );
  }
}
