// ---------------------------------------------------------
// 1. Configuration & State
// ---------------------------------------------------------
let currentPersonalityType = 'mbti'; // 'mbti' or 'enneagram'

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    populateDurationOptions();
});

// ---------------------------------------------------------
// 2. UI Logic (Tabs, Duration, etc.)
// ---------------------------------------------------------
function switchTab(type) {
    currentPersonalityType = type;
    const mbtiBtn = document.getElementById('tab-mbti');
    const enneagramBtn = document.getElementById('tab-enneagram');
    const mbtiSelect = document.getElementById('select-mbti-container');
    const enneagramSelect = document.getElementById('select-enneagram-container');

    if (type === 'mbti') {
        mbtiBtn.classList.add('text-sky-600', 'border-b-2', 'border-sky-600');
        mbtiBtn.classList.remove('text-gray-400', 'border-b-0');
        enneagramBtn.classList.remove('text-sky-600', 'border-b-2', 'border-sky-600');
        enneagramBtn.classList.add('text-gray-400');
        
        mbtiSelect.classList.remove('hidden');
        enneagramSelect.classList.add('hidden');
    } else {
        enneagramBtn.classList.add('text-sky-600', 'border-b-2', 'border-sky-600');
        enneagramBtn.classList.remove('text-gray-400', 'border-b-0');
        mbtiBtn.classList.remove('text-sky-600', 'border-b-2', 'border-sky-600');
        mbtiBtn.classList.add('text-gray-400');

        enneagramSelect.classList.remove('hidden');
        mbtiSelect.classList.add('hidden');
    }
}

function populateDurationOptions() {
    const select = document.getElementById('duration');
    const travelType = document.querySelector('input[name="travelType"]:checked').value;
    select.innerHTML = ''; // Clear existing

    // Default start: Domestic can be 1 day, Overseas typically starts from 3 days
    let startDay = 1;
    if (travelType === 'overseas') startDay = 1; // Allow user flexibility, but logic suggests more

    for (let i = startDay; i <= 14; i++) {
        const option = document.createElement('option');
        option.value = i;
        if (i === 1) {
            option.text = `1일 (당일치기)`;
        } else {
            option.text = `${i}일 (${i-1}박 ${i}일)`;
        }
        
        // 해외여행 기본값은 3박 4일 정도로 설정해주면 센스 있음
        if (travelType === 'overseas' && i === 4) {
            option.selected = true;
        }
        // 국내여행 기본값은 1박 2일
        if (travelType === 'domestic' && i === 2) {
            option.selected = true;
        }

        select.appendChild(option);
    }
}

function toggleDurationOptions() {
    // Re-populate when travel type changes to set smart defaults
    populateDurationOptions();
}

function resetApp() {
    document.getElementById('result-section').classList.add('hidden');
    document.getElementById('input-section').classList.remove('hidden');
    document.getElementById('input-section').classList.add('fade-in');
    // Clear previous course
    document.getElementById('result-course-container').innerHTML = '';
}

// ---------------------------------------------------------
// 3. Gemini API Logic
// ---------------------------------------------------------
async function getRecommendation() {
    // 1. Collect Input Data
    const travelType = document.querySelector('input[name="travelType"]:checked').value; // domestic or overseas
    const style = document.getElementById('travel-style').value;
    const budget = document.getElementById('budget').value;
    const duration = document.getElementById('duration').value; // Number of days
    
    let personality = "";
    if (currentPersonalityType === 'mbti') {
        personality = "MBTI: " + document.getElementById('mbti-select').value;
    } else {
        personality = "Enneagram Type: " + document.getElementById('enneagram-select').value;
    }

    // 2. Show Loading UI
    document.getElementById('input-section').classList.add('hidden');
    document.getElementById('loading-section').style.display = 'flex';

    // 3. Construct Prompt
    let locationConstraint = "";
    if (travelType === 'domestic') {
        locationConstraint = "추천 범위: 반드시 '대한민국' 내의 도시나 지역이어야 함.";
    } else {
        locationConstraint = "추천 범위: '대한민국'을 제외한 전 세계 해외 여행지.";
    }

    const promptText = `
        역할: 당신은 전문 여행 가이드입니다.
        사용자 정보:
        - 여행 유형: ${travelType === 'domestic' ? '국내 여행' : '해외 여행'}
        - 성격: ${personality}
        - 스타일: ${style}
        - 예산: ${budget}
        - 여행 기간: ${duration}일
        
        ${locationConstraint}
        
        위 정보를 바탕으로 최적의 여행지 1곳을 추천해주세요.
        반드시 아래 JSON 형식으로만 응답하세요. (마크다운이나 설명 없이 JSON만 출력)
        
        {
            "city_name_kr": "도시 한글명",
            "city_name_en": "도시 영문명 (해외면 영어, 국내면 로마자 표기)",
            "iata_code": "해당 도시의 공항 IATA 코드 3자리 (예: 다낭이면 DAD, 국내 여행이면 빈 문자열)",
            "country": "국가명",
            "reason": "추천 이유 (3문장 이내, 감성적인 톤)",
            "itinerary": [
                { "day": 1, "schedule": "1일차 상세 일정 및 활동" },
                { "day": 2, "schedule": "2일차 상세 일정 및 활동" }
                ... (여행 기간 ${duration}일에 맞춰 생성)
            ],
            "keyword": "검색용 키워드 (예: 다낭 여행)"
        }
    `;

    try {
        // 4. API Call
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptText }]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) throw new Error('API 호출 실패');

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;
        const result = JSON.parse(aiText);

        // 5. Update UI with Result
        updateResultUI(result, travelType);

    } catch (error) {
        console.error(error);
        alert("여행지 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        resetApp();
    } finally {
        // Hide Loading
        document.getElementById('loading-section').style.display = 'none';
    }
}

// ---------------------------------------------------------
// 4. Dynamic Link Logic & Render
// ---------------------------------------------------------
function updateResultUI(data, travelType) {
    // Text Updates
    document.getElementById('result-city').innerText = data.city_name_kr;
    document.getElementById('result-country').innerText = data.country;
    document.getElementById('result-reason').innerText = data.reason;
    
    // Course Render (Systematic Display)
    const courseContainer = document.getElementById('result-course-container');
    courseContainer.innerHTML = ''; // Clear old

    if (data.itinerary && Array.isArray(data.itinerary)) {
        data.itinerary.forEach(dayPlan => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <span class="timeline-dot"></span>
                <h5 class="text-sm font-bold text-sky-600 mb-1">Day ${dayPlan.day}</h5>
                <p class="text-gray-700 text-sm leading-snug bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                    ${dayPlan.schedule}
                </p>
            `;
            courseContainer.appendChild(item);
        });
    } else {
        // Fallback if AI returns unstructured text
         const item = document.createElement('div');
         item.className = 'p-3 bg-gray-50 rounded text-sm';
         item.innerText = "일정 정보를 불러오는데 실패했습니다.";
         courseContainer.appendChild(item);
    }

    // Button Logic
    const btn1 = document.getElementById('btn-link-1');
    const btn2 = document.getElementById('btn-link-2');

    if (travelType === 'overseas') {
        // Case A: 해외 여행 (스카이스캐너 & 아고다)
        const destinationCode = data.iata_code || data.city_name_en; 
        const flightUrl = `https://www.skyscanner.co.kr/transport/flights/sel/${destinationCode}`;
        
        btn1.innerHTML = '<i class="fa-solid fa-plane-up mr-2"></i>최저가 항공권 확인';
        btn1.href = flightUrl;

        // Agoda Link: 한글명(city_name_kr) 대신 영문명(city_name_en)을 사용하여 검색 정확도 향상
        // 영문명이 아고다 데이터베이스와 매칭될 확률이 훨씬 높습니다.
        const hotelUrl = `https://www.agoda.com/ko-kr/search?text=${encodeURIComponent(data.city_name_en)}`;
        btn2.innerHTML = '<i class="fa-solid fa-hotel mr-2"></i>숙소 최저가 보기';
        btn2.href = hotelUrl;

    } else {
        // Case B: 국내 여행 (네이버 & 쿠팡)
        const naverUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(data.city_name_kr + ' 여행')}`;
        btn1.innerHTML = '<i class="fa-solid fa-magnifying-glass mr-2"></i>여행 코스/맛집 검색';
        btn1.href = naverUrl;

        const coupangUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(data.city_name_kr + ' 펜션')}`;
        btn2.innerHTML = '<i class="fa-solid fa-house-chimney mr-2"></i>감성 숙소 예약하기';
        btn2.href = coupangUrl;
    }

    // Show Result
    document.getElementById('result-section').classList.remove('hidden');
}