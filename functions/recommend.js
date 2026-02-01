export async function onRequestPost(context) {
  // 1. API 키 가져오기 (VITE_GEMINI_API_KEY 사용)
  const apiKey = context.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server Configuration Error: API Key missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 2. 프론트엔드에서 보낸 완성된 JSON을 그대로 받음
    const requestBody = await context.request.json();

    // 3. Gemini API 호출 (Pass-through 방식)
    // 들어온 Body를 건드리지 않고 그대로 Google에 전달합니다.
    const googleResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    // 4. 응답 처리
    if (!googleResponse.ok) {
        const errorText = await googleResponse.text();
        return new Response(JSON.stringify({ 
            error: `Google API Error: ${googleResponse.status}`, 
            details: errorText 
        }), {
            status: googleResponse.status,
            headers: { "Content-Type": "application/json" },
        });
    }

    const data = await googleResponse.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal Server Error", details: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}