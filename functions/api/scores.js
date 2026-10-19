export async function onRequestGet(context) {
  try {
    const scoresData = await context.env.LEADERBOARD.get("top_scores");
    let scores = scoresData ? JSON.parse(scoresData) : [];
    return new Response(JSON.stringify(scores), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    let name = (body.name || "Anonyme").substring(0, 15).trim();
    let score = parseInt(body.score, 10);

    if (isNaN(score) || score <= 0) {
      return new Response(JSON.stringify({ error: "Score invalide" }), { status: 400 });
    }

    let scoresData = await context.env.LEADERBOARD.get("top_scores");
    let scores = scoresData ? JSON.parse(scoresData) : [];

    scores.push({ name, score, date: Date.now() });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 10);

    await context.env.LEADERBOARD.put("top_scores", JSON.stringify(scores));

    return new Response(JSON.stringify({ success: true, scores }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
  }
}
