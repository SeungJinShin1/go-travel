export async function onRequestPost(context) {
  // 1. Cloudflare 환경변수에서 API 키 가져오기
  // (Cloudflare Settings -> Variables and Secrets에 설정한 이름과 같아야 함)
  const apiKey = context.env.VITE_GEMINI_API_KEY;

  // API 키가 없는 경우 에러 처리
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server Error: API Key not configured" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 2. 프론트엔드(index.html)에서 보낸 데이터 받기
    const requestBody = await context.request.json();

    // 3. Google Gemini API 호출 (여기서 비밀 키 사용)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    const apiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // 4. Google API 응답을 그대로 프론트엔드에 전달
    const data = await apiResponse.json();

    return new Response(JSON.stringify(data), {
      headers: { 
        'Content-Type': 'application/json' 
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}