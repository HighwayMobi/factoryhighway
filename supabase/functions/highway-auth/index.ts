const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const login = Deno.env.get("HIGHWAY_LOGIN");
    const password = Deno.env.get("HIGHWAY_PASSWORD");
    if (!login || !password) {
      return new Response(
        JSON.stringify({ error: "Server credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const upstream = await fetch("https://sim.highway.mobi/web/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ login, password }),
    });

    const text = await upstream.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch {}

    if (!upstream.ok) {
      console.error("highway-auth upstream error", upstream.status, text);
      return new Response(
        JSON.stringify({ error: "Auth failed", status: upstream.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Extract token from various possible shapes
    const token =
      json?.data?.token ??
      json?.token ??
      json?.data?.access_token ??
      json?.access_token ??
      null;

    if (!token) {
      console.error("highway-auth: token not found in response", text);
      return new Response(
        JSON.stringify({ error: "Token missing in upstream response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ token, expires_in: 60 * 60 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("highway-auth exception", e);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
