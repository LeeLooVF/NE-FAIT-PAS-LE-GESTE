export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Vérification de la présence de la base KV liée
  if (!env.LEADERBOARD) {
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    // 1. Récupération des scores (GET)
    if (request.method === "GET") {
      const data = await env.LEADERBOARD.get("leaderboard");
      let scores = [];
      if (data) {
        try {
          scores = JSON.parse(data);
        } catch (e) {
          scores = [];
        }
      }
      return new Response(JSON.stringify(scores), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. Enregistrement d'un score (POST)
    if (request.method === "POST") {
      const body = await request.json();
      const name = (body.name || "Anonyme").substring(0, 15).trim();
      const score = parseInt(body.score, 10);

      if (isNaN(score) || score <= 0) {
        return new Response(JSON.stringify({ error: "Score invalide" }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const data = await env.LEADERBOARD.get("leaderboard");
      let scores = [];
      if (data) {
        try {
          scores = JSON.parse(data);
        } catch (e) {
          scores = [];
        }
      }

      scores.push({ name, score, date: Date.now() });
      scores.sort((a, b) => b.score - a.score);
      scores = scores.slice(0, 10);

      await env.LEADERBOARD.put("leaderboard", JSON.stringify(scores));

      return new Response(JSON.stringify({ success: true, scores }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  return new Response("Not allowed", { status: 405, headers: corsHeaders });
}
