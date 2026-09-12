export default {
  async fetch(request) {
    const cors = {
      "Access-Control-Allow-Origin": "https://gulerhll.github.io",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);
    const target = url.searchParams.get("url");

    if (!target) {
      return new Response("Proxy hazır", { headers: cors });
    }

    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch {
      return new Response("Geçersiz adres", { status: 400, headers: cors });
    }

    const allowedHosts = new Set(["tinyurl.com", "www.tinyurl.com", "fabulasp.xyz"]);
    if (!allowedHosts.has(targetUrl.hostname)) {
      return new Response("Bu sunucuya izin verilmiyor", {
        status: 403,
        headers: cors
      });
    }

    try {
      const response = await fetch(targetUrl.toString(), {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "*/*"
        }
      });

      const headers = new Headers(response.headers);
      Object.entries(cors).forEach(([k, v]) => headers.set(k, v));

      return new Response(response.body, {
        status: response.status,
        headers
      });
    } catch (e) {
      return new Response("Sunucu bağlantı hatası: " + (e?.message || String(e)), {
        status: 502,
        headers: cors
      });
    }
  }
};
