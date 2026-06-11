export function getJoolanAuth() {
  const apiKey = process.env.OOPOS_API_KEY;
  const enseigne = process.env.OOPOS_ENSEIGNE;
  const domain = process.env.OOPOS_DOMAIN;
  const baseUrl = domain?.startsWith('http') ? domain : `https://${domain}`;

  if (!apiKey || !enseigne || !domain) {
    console.error("Missing credentials:", { apiKey: !!apiKey, enseigne: !!enseigne, domain: !!domain });
    throw new Error("OOPOS credentials not configured");
  }

  const baseParams: any = {
    "api-key": apiKey,
    enseigne,
    "output-format": "json",
  };

  return {
    baseUrl,
    baseParams
  };
}
