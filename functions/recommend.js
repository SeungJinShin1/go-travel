export async function onRequestPost(context) {
    // Cloudflare 환경 변수에서 API 키를 가져옵니다.
    // Settings -> Variables and Secrets에 저장한 이름(VITE_GEMINI_API_KEY)과 일치해야 합니다.
    const apiKey = context.env.VITE_GEMINI_API_KEY;
  
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key not configured in Cloudflare" }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  
    try {
      // 1. main.js에서 보낸 요청 본문(JSON)을 읽습니다.
      const requestBody = await context.request.json();
  
      // 2. Google Gemini API 호출
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      
      const apiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
  
      // 3. Google API 응답 받기
      const data = await apiResponse.json();
  
      // 4. 프론트엔드로 결과 반환
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
  