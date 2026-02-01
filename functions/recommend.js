export async function onRequestPost(context) {
  // 1. Cloudflare 환경변수 가져오기 (이름 유연하게 처리)
  // 사용자가 'VITE_'를 붙였든 안 붙였든 둘 다 확인합니다.
  const apiKey = context.env.VITE_GEMINI_API_KEY;

  // API 키가 없는 경우 구체적인 에러 반환
  if (!apiKey) {
    return new Response(JSON.stringify({ 
      error: "Critical: API Key is missing. Check Cloudflare Settings > Environment Variables." 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const requestBody = await context.request.json();
    const { prompt } = requestBody; 

    // Google Gemini API 호출
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    const apiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            responseMimeType: "application/json"
        }
      })
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        // Gemini 쪽 에러인지 명확히 전달
        throw new Error(`Gemini API Error: ${errorData.error?.message || apiResponse.statusText}`);
    }

    const data = await apiResponse.json();

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // 서버 내부 오류 내용을 반환
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}