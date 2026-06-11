import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getJoolanAuth } from "@/lib/joolan-auth";

export async function GET(request: NextRequest) {
  try {
    const { baseUrl, baseParams: params } = getJoolanAuth();

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action") || "image-stocks";

    // Add optional parameters based on action
    if (action === "image-stocks") {
      const magasins = searchParams.get("magasins");
      if (magasins) params.Magasins = magasins;
    } else if (action === "stock") {
      const produit = searchParams.get("produit");
      const couleur = searchParams.get("couleur");
      const taille = searchParams.get("taille");
      const magasins = searchParams.get("magasins");

      if (!produit) {
        return NextResponse.json(
          { error: "Produit parameter is required" },
          { status: 400 }
        );
      }

      params.Produit = produit;
      if (couleur) params.Couleur = couleur;
      if (taille) params.Taille = taille;
      if (magasins) params.Magasins = magasins;
    }

    const endpoint =
      action === "stock"
        ? "/stock.do"
        : action === "full-stocks"
          ? "/image-full-stocks.do"
          : "/image-stocks.do";

    const url = `${baseUrl}/api/v2${endpoint}`;
    if (!params['output-format']) params['output-format'] = 'json';
    console.log("OOPOS Request:", { url, params });

    const response = await axios.get(url, {
      params,
      timeout: 10000,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Stock API error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch stock data",
      },
      { status: error.response?.status || 500 }
    );
  }
}

