// 1. 상태 변수
let currentPersonalityType = 'mbti'; 

// 2. 함수 정의

// 탭 전환 함수
function switchTab(type) {
    console.log("Tab switching to:", type); 
    currentPersonalityType = type;
    const mbtiBtn = document.getElementById('tab-mbti');
    const enneagramBtn = document.getElementById('tab-enneagram');
    const mbtiSelect = document.getElementById('select-mbti-container');
    const enneagramSelect = document.getElementById('select-enneagram-container');

    if (type === 'mbti') {
        // MBTI 활성화
        mbtiBtn.classList.add('text-sky-600', 'border-b-2', 'border-sky-600');
        mbtiBtn.classList.remove('text-gray-400');
        
        enneagramBtn.classList.remove('text-sky-600', 'border-b-2', 'border-sky-600');
        enneagramBtn.classList.add('text-gray-400');
        
        mbtiSelect.classList.remove('hidden');
        enneagramSelect.classList.add('hidden');
    } else {
        // 에니어그램 활성화
        enneagramBtn.classList.add('text-sky-600', 'border-b-2', 'border-sky-600');
        enneagramBtn.classList.remove('text-gray-400');
        
        mbtiBtn.classList.remove('text-sky-600', 'border-b-2', 'border-sky-600');
        mbtiBtn.classList.add('text-gray-400');

        enneagramSelect.classList.remove('hidden');
        mbtiSelect.classList.add('hidden');
    }
}

// 여행 기간 옵션 설정
function populateDurationOptions() {
    const select = document.getElementById('duration');
    const travelType = document.querySelector('input[name="travelType"]:checked').value;
    
    if (travelType === 'overseas') {
        select.value = "4";
    } else {
        select.value = "2";
    }
}

// 라디오 버튼 변경 시 호출
function toggleDurationOptions() {
    populateDurationOptions();
}

// 앱 리셋 (중요: 로딩 화면 숨김 로직 강화)
function resetApp() {
    document.getElementById('result-section').classList.add('hidden');
    document.getElementById('input-section').classList.remove('hidden');
    document.getElementById('input-section').classList.add('fade-in');
    document.getElementById('result-course-container').innerHTML = '';
    
    // 로딩 섹션 숨기기
    const loadingSection = document.getElementById('loading-section');
    loadingSection.classList.add('hidden');
    loadingSection.style.display = 'none';

    // [중요] 리셋 시 설명 텍스트(정보 섹션) 다시 보이기
    // 이 부분이 추가된 로직입니다. (다시 하기 누르면 설명글 복구)
    const infoSection = document.getElementById('info-section');
    if (infoSection) {
        infoSection.style.display = 'block';
    }
}

// API 호출 함수
async function getRecommendation() {
    const travelType = document.querySelector('input[name="travelType"]:checked').value;
    const style = document.getElementById('travel-style').value;
    const budget = document.getElementById('budget').value;
    const duration = document.getElementById('duration').value;
    
    let personality = "";
    if (currentPersonalityType === 'mbti') {
        personality = "MBTI: " + document.getElementById('mbti-select').value;
    } else {
        personality = "Enneagram Type: " + document.getElementById('enneagram-select').value;
    }

    // [중요] 로딩 시작 시 설명 텍스트(정보 섹션) 숨기기
    // 결과 화면에 집중할 수 있도록 긴 글을 숨기는 로직입니다.
    const infoSection = document.getElementById('info-section');
    if (infoSection) {
        infoSection.style.display = 'none';
    }

    // 로딩 화면 표시
    document.getElementById('input-section').classList.add('hidden');
    const loadingSection = document.getElementById('loading-section');
    loadingSection.classList.remove('hidden'); 
    loadingSection.style.display = 'flex';     

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
        // Vercel API 경로 (/api/recommend) 호출
        const response = await fetch('/api/recommend', {
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

        if (!response.ok) throw new Error(`API 호출 실패: ${response.status}`);

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error("AI 응답 형식이 올바르지 않습니다.");
        }

        const aiText = data.candidates[0].content.parts[0].text;
        const result = JSON.parse(aiText);

        updateResultUI(result, travelType);

    } catch (error) {
        console.error(error);
        alert(`여행지 분석 중 오류가 발생했습니다.\n${error.message}\n(Vercel 환경변수 설정 및 api 폴더 위치를 확인하세요)`);
        resetApp();
    } finally {
        loadingSection.classList.add('hidden');
        loadingSection.style.display = 'none';
    }
}

// 결과 화면 업데이트
function updateResultUI(data, travelType) {
    document.getElementById('result-city').innerText = data.city_name_kr;
    document.getElementById('result-country').innerText = data.country;
    document.getElementById('result-reason').innerText = data.reason;
    
    const courseContainer = document.getElementById('result-course-container');
    courseContainer.innerHTML = ''; 

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
            const item = document.createElement('div');
            item.className = 'p-3 bg-gray-50 rounded text-sm';
            item.innerText = "일정 정보를 불러오는데 실패했습니다.";
            courseContainer.appendChild(item);
    }

    const btn1 = document.getElementById('btn-link-1');
    const btn2 = document.getElementById('btn-link-2');

    if (travelType === 'overseas') {
        const destinationCode = data.iata_code || data.city_name_en; 
        const flightUrl = `https://www.skyscanner.co.kr/transport/flights/sel/${destinationCode}`;
        
        btn1.innerHTML = '<i class="fa-solid fa-plane-up mr-2"></i>최저가 항공권 확인';
        btn1.href = flightUrl;

        const hotelUrl = `https://www.agoda.com/ko-kr/search?text=${encodeURIComponent(data.city_name_en)}`;
        btn2.innerHTML = '<i class="fa-solid fa-hotel mr-2"></i>숙소 최저가 보기';
        btn2.href = hotelUrl;

    } else {
        const naverUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(data.city_name_kr + ' 여행')}`;
        btn1.innerHTML = '<i class="fa-solid fa-magnifying-glass mr-2"></i>여행 코스/맛집 검색';
        btn1.href = naverUrl;

        // [기존 요청 반영] 국내 숙소도 아고다 연결
        const hotelUrl = `https://www.agoda.com/ko-kr/search?text=${encodeURIComponent(data.city_name_kr)}`;
        btn2.innerHTML = '<i class="fa-solid fa-hotel mr-2"></i>숙소 최저가 보기';
        btn2.href = hotelUrl;
    }

    document.getElementById('result-section').classList.remove('hidden');
}

// 3. window 객체에 함수 할당
window.switchTab = switchTab;
window.toggleDurationOptions = toggleDurationOptions;
window.getRecommendation = getRecommendation;
window.resetApp = resetApp;

window.addEventListener('DOMContentLoaded', () => {
    // 초기화 로직
    populateDurationOptions();
});