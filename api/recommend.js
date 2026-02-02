export default async function handler(req, res) {
  // 1. POST 요청인지 확인
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Vercel 환경 변수에서 API 키 가져오기
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server Error: API Key not configured' });
  }

  try {
    // 3. 프론트엔드에서 보낸 데이터 받기 (req.body)
    const requestBody = req.body;

    // 4. Google Gemini API 호출
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await apiResponse.json();

    // 5. 결과 반환
    return res.status(200).json(data);

  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}