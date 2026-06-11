const DEFAULT_API_BASE = "http://localhost:5000/api/v1";

export const resolveApiBase = (): string => {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  const base = configured && configured.length > 0 ? configured : DEFAULT_API_BASE;
  return base.replace(/\/+$/, "");
};
