export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET : Récupérer le top 10
    if (request.method === "GET") {
      const scoresData = await env.LEADERBOARD.get("top_scores");
      let scores = scoresData ? JSON.parse(scoresData) : [];
      return new Response(JSON.stringify(scores), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // POST : Enregistrer un score
    if (request.method === "POST") {
      const body = await request.json();
      let name = (body.name || "Anonyme").substring(0, 15).trim();
      let score = parseInt(body.score, 10);

      if (isNaN(score) || score <= 0) {
        return new Response(JSON.stringify({ error: "Score invalide" }), { status: 400, headers: corsHeaders });
      }

      let scoresData = await env.LEADERBOARD.get("top_scores");
      let scores = scoresData ? JSON.parse(scoresData) : [];

      scores.push({ name, score, date: Date.now() });
      scores.sort((a, b) => b.score - a.score);
      scores = scores.slice(0, 10);

      await env.LEADERBOARD.put("top_scores", JSON.stringify(scores));

      return new Response(JSON.stringify({ success: true, scores }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }

  return new Response("Méthode non autorisée", { status: 405, headers: corsHeaders });
}
