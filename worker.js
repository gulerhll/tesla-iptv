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

    if (targetUrl.hostname !== "fabulasp.xyz") {
      return new Response("Bu sunucuya izin verilmiyor", {
        status: 403,
        headers: cors
      });
    }

    async function fetchOrigin(u) {
      return fetch(u.toString(), {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "*/*"
        }
      });
    }

    function makeResponse(response, usedUrl) {
      const headers = new Headers(response.headers);
      Object.entries(cors).forEach(([k, v]) => headers.set(k, v));
      headers.set("X-Proxy-Origin", usedUrl.protocol.replace(":", ""));
      return new Response(response.body, {
        status: response.status,
        headers
      });
    }

    try {
      let usedUrl = new URL(targetUrl.toString());

      try {
        const response = await fetchOrigin(usedUrl);

        if (usedUrl.protocol === "https:" && response.status >= 500) {
          const fallbackUrl = new URL(targetUrl.toString());
          fallbackUrl.protocol = "http:";
          const fallbackResponse = await fetchOrigin(fallbackUrl);
          return makeResponse(fallbackResponse, fallbackUrl);
        }

        return makeResponse(response, usedUrl);
      } catch (firstError) {
        if (usedUrl.protocol !== "https:") throw firstError;

        usedUrl.protocol = "http:";
        const response = await fetchOrigin(usedUrl);
        return makeResponse(response, usedUrl);
      }
    } catch (e) {
      return new Response("Sunucu bağlantı hatası: " + (e?.message || String(e)), {
        status: 502,
        headers: cors
      });
    }
  }
};
