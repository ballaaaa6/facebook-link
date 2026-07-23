function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ service: "affiliate-ops-discord", status: "ok", version: "0.1.0" });
    }

    if (request.method === "POST" && url.pathname === "/interactions") {
      return json(
        {
          error: "signature_verification_not_configured",
          message: "Discord interactions remain disabled until Ed25519 verification and secrets are configured.",
        },
        503,
      );
    }

    return json({ error: "not_found" }, 404);
  },
};
