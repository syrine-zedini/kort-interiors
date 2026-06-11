import { useEffect, useState } from "react";
import { resolveApiBase } from "@/libs/apiBase";

export interface InstagramPost {
  id: string;
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  timestamp: string;
}

const apiBase = resolveApiBase();

export function useInstagramPosts() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const shouldFetchInstagram =
      process.env.NEXT_PUBLIC_ENABLE_INSTAGRAM_FETCH === "true" ||
      process.env.NODE_ENV !== "production";

    if (!shouldFetchInstagram) {
      setLoading(false);
      setError(null);
      return;
    }

    fetch(`${apiBase}/social/instagram`)
      .then((r) => {
        if (!r.ok) throw new Error("Erreur récupération Instagram");
        return r.json();
      })
      .then((json) => {
        setPosts(json.data ?? []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return { posts, loading, error };
}
