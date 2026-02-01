export async function onRequestPost(context) {
  // 1. Cloudflare 환경변수에서 API 키 가져오기
  // (Cloudflare Settings -> Variables and Secrets에 설정한 이름: VITE_GEMINI_API_KEY)
  const apiKey = context.env.VITE_GEMINI_API_KEY;

  // API 키가 없는 경우 에러 처리
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server Error: API Key not configured" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 2. 프론트엔드(main.js)에서 보낸 데이터 받기
    const requestBody = await context.request.json();
    
    // main.js는 { prompt: "..." } 형태의 간단한 데이터를 보냅니다.
    // Gemini API가 이해할 수 있는 복잡한 형태로 변환
    const { prompt } = requestBody; 

    // 3. Google Gemini API 호출
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    const apiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // 여기서 프롬프트를 Gemini 포맷으로 감싸서 전송합니다.
      body: JSON.stringify({
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            responseMimeType: "application/json"
        }
      })
    });

    // Gemini API 응답 오류 처리
    if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error?.message || 'Gemini API Error');
    }

    // 4. Google API 응답을 프론트엔드에 전달
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