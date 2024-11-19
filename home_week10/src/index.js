import axios from 'axios';

const hTitle = document.querySelector("#title");
const hSubtitle = document.querySelector("#subtitle");
const divLoading = document.querySelector(".loading");
const divResult = document.querySelector(".result");
const modeButton = document.querySelector("#modeButton");
const dayNight = { day: false };

class Coordinate {
    constructor(x, y) {
        this.latitude = Math.round(x * 100) / 100;
        this.longitude = Math.round(y * 100) / 100;
    }
}

class Weather {
    constructor(forecast, targetTime = 24) {
        const date = new Date();
        // 현재 시각.
        const nowLocalTime = date.getHours();
        // 목표 로컬 시각까지 남은 시간.
        let hoursToTargetTime = targetTime - nowLocalTime;
        // 음수 보정.
        if (hoursToTargetTime < 0) hoursToTargetTime += 24;
        // API의 갱신 시각. 그리니치 표준시.
        const initTime = parseInt(forecast.init) % 100;
        const initDay = parseInt((parseInt(forecast.init) / 100) % 100);
        // 목표 로컬 시각일 때 표준 시각.
        const targetTimeInUTC = (date.getUTCDate() - initDay) * 24 + date.getUTCHours() + hoursToTargetTime;
        // 목표 로컬 시각까지 갱신 표준 시각에서 남은 시간.
        let initTimeToTargetTimeInUTC = targetTimeInUTC - initTime;
        // API는 갱신 시각의 날씨 정보는 없음(+3시간 부터 제공). 현재가 목표 시각이라면 목표 시각을 24시간 뒤로 지정.
        initTimeToTargetTimeInUTC = initTimeToTargetTimeInUTC === 0 ? 24 : initTimeToTargetTimeInUTC;
        // API는 3시간 단위로 정보 제공. 목표 시각에 제일 가까운 인덱스 지정.
        let timepointIndex = Math.round(initTimeToTargetTimeInUTC / 3.0) - 1;
        // 음수 보정.
        if (timepointIndex < 0) timepointIndex = 0;

        const target = forecast.dataseries[timepointIndex];
        // 선택된 날씨 정보의 로컬 시간.
        this.timepoint = target.timepoint + initTime - (date.getTimezoneOffset() / 60);
        this.cloudLevel = getCloudLevel();      //0: completly clear 1: little bit 2: cloudy 3: filled
        this.starLevel = getStarLevel();        //0: faint star 1: dark star 2: bright star 3: brightest star
        this.transparency = getTransparency();  //0: clear 1: thin 2: thick 3: blocked
        this.instability = getInstability();    //0: stable 1: little bit 2: unstable 3: thunderstorm
        this.prec = target.prec_type;           //"rain" "snow" "none"
        this.humidity = getHumidity();          //20: desert 100: fish pond
        this.windPower = getWindSpeed();        //0: no wind 35: ahhhhhh
        this.windDirection = target.wind10m.direction;
        this.temperature = target.temp2m;       //celcius

        // 이하 메서드는 API 반환 값을 표현용으로 구간 매핑. ^ 위의 주석이 표현용 매핑.
        function getCloudLevel() {
            switch (target.cloudcover) {
                case 1: return 0;
                case 2:
                case 3:
                case 4: return 1;
                case 5:
                case 6:
                case 7:
                case 8: return 2;
                case 9: return 3;
            }
        }

        function getStarLevel() {
            switch (target.seeing) {
                case 1: return 0;
                case 2:
                case 3:
                case 4:
                case 5: return 1;
                case 6:
                case 7: return 2;
                case 8: return 3;
            }
        }

        function getTransparency() {
            switch (target.seeing) {
                case 1: return 0;
                case 2:
                case 3:
                case 4: return 1;
                case 5:
                case 6:
                case 7: return 2;
                case 8: return 3;
            }
        }

        function getInstability() {
            switch (target.lifted_index) {
                case -10:
                case -6: return 3;
                case -4: return 2;
                case -1: return 1;
                case 2:
                case 6:
                case 10:
                case 15: return 0;
            }
        }

        function getHumidity() {
            switch (target.rh2m) {
                case -4:
                case -3:
                case -2:
                case -1: return 20;
                case 0: return 23;
                case 1: return 28;
                case 2: return 33;
                case 3: return 38;
                case 4: return 43;
                case 5: return 48;
                case 6: return 53;
                case 7: return 58;
                case 8: return 63;
                case 9: return 68;
                case 10: return 73;
                case 11: return 78;
                case 12: return 83;
                case 13: return 88;
                case 14: return 93;
                case 15:
                case 16: return 100;
            }
        }

        function getWindSpeed() {
            switch (target.wind10m.speed) {
                case 1: return 0;
                case 2: return 2;
                case 3: return 5;
                case 4: return 9;
                case 5: return 15;
                case 6: return 20;
                case 7: return 28;
                case 8: return 35;
            }
        }
    }
}

// 제목 설정.
function setTitle(message) {
    hTitle.innerText = message;
}

// 부제목 설정. 기온이 여기에 표시됨.
function setSubtitle(message) {
    hSubtitle.innerText = message;
}

// 배경 이미지 설정. 알터 메시지를 곁들인.
function setBackImage(image, alt) {
    const img = document.querySelector("#mainImage");
    img.alt = alt;
    img.src = `images/${image}.png`;
}

// 로딩 디스크 아래 메시지 설정.
function setLoadingMessage(message) {
    const info = divLoading.querySelector("#loadInfo");
    info.innerText = message;
}

// 로드 실패 시 호출. 디스크 -> 가위표로 변경.
function setLoadStatFailed() {
    const stat = divLoading.querySelector("#loadStatus");
    stat.classList.replace('onLoading', 'failed');
}

// API 재요청 판단. 로컬에 정보가 없거나,
// 저장해 둔 API의 갱신 시각과 현재 시각이 6시간 넘게 차이나면 갱신 필요 표시.
function isNeedRefresh() {
    if (localStorage.getItem('weather') === null) return true;
    const lastTime = localStorage.getItem('baseTime');
    const now = new Date();
    const nowTime = '' + ('' + now.getUTCFullYear()).padStart(4, '0') + (now.getUTCMonth() + 1 + '').padStart(2, '0')
         + ('' + now.getUTCDate()).padStart(2, '0') + ('' + now.getUTCHours()).padStart(2, '0');
    if (lastTime === null || parseInt(nowTime) - parseInt(lastTime) > 6) {
        localStorage.setItem('baseTime', nowTime);
        return true;
    }
    return false;
}

async function getCoord() {
    setLoadingMessage("위치 정보 파악 중...")
    try {
        const response = await axios.get('http://ip-api.com/json/112.164.229.46');
        return new Coordinate(response.data.lat, response.data.lon);
    } catch (error) {
        setLoadStatFailed();
        setLoadingMessage("IP 기반 위치정보 파악에 실패했습니다.");
        return null;
    }
}

async function getWeather(coord) {
    setLoadingMessage("날씨 정보 불러오는 중...")
    try {
        const response = await axios
            .get('http://www.7timer.info/bin/api.pl', {
                params: {
                    lon: coord.longitude,
                    lat: coord.latitude,
                    product: 'astro',
                    output: 'json'
                }
            });
        return response.data;
    } catch (error) {
        setLoadStatFailed();
        setLoadingMessage("날씨 정보를 받아오지 못했습니다.");
        return null;
    }
}

// 날씨 정보 표시용 블럭 반환. 이미지 명은 알터 정보로도 쓸 수 있게 해 두었음.
function setGridElement(id, imgName, status, desc) {
    divResult.querySelector(id).innerHTML =
        `<img class='statIcon' src='./images/icons/${imgName}.png' alt='${imgName}'></img>
    <p class='weatherStat'>${status}</p>
    <p class='weatherDesc'>${desc}</p>`;
}

// 날씨 정보가 로드 되면 로드 완료 클래스 추가.
// 갱신 애니메이션용.
function setGridElemLoaded(id) {
    divResult.querySelector(id).classList.add("elemLoaded");
}

// 모드 변환 시 호출.
// 갱신 애니메이션이 매 갱신마다 작동하도록 초기화.
function resetGridElemLoaded() {
    divResult.querySelectorAll(".elemLoaded").forEach((t) => t.classList.remove("elemLoaded"));
}

// 이하 메서드는 표현용 매핑을 이용하여 실제 표현 문구로 그리드 원소 설정.
function displayCloudLevel(cLevel) {
    const id = "#resCloud";
    switch (cLevel) {
        case 0: setGridElement(id, 'moon', '청명', '구름 한 점 없어요'); break;
        case 1: setGridElement(id, 'moon', '구름 조금', '맑은 하늘이에요'); break;
        case 2: setGridElement(id, 'moon with cloud', '구름 많음', '구름이 꼈어요'); break;
        case 3: setGridElement(id, 'clouds', '구름 가득', '온통 구름이에요'); break;
    }
    setGridElemLoaded(id);
}

function displayStarLevel(sLevel) {
    const id = "#resSeeing";
    switch (sLevel) {
        case 0: setGridElement(id, 'faint star', '가득한 별', '잘 안보이던 별도 보일 거예요'); break;
        case 1: setGridElement(id, 'dark star', '많은 별', '어두운 별도 보일 거예요'); break;
        case 2: setGridElement(id, 'bright star', '밝은 별만', '어두운 별은 안 보여요'); break;
        case 3: setGridElement(id, 'bright star', '낮은 시계', '밝은 별만 보일 거예요'); break;
    }
    if(dayNight.day) setGridElement(id, 'sun', '너무 밝음', '낮에는 별이 안 보여요')
    setGridElemLoaded(id);
}

function displayTransparency(tLevel) {
    const id = "#resTransparency";
    const img = "solar ray penetrate cloud";
    switch (tLevel) {
        case 0: setGridElement(id, img, '투명한 하늘', '하늘이 선명히 보여요'); break;
        case 1: setGridElement(id, img, '맑은 하늘', '투과율이 높아요'); break;
        case 2: setGridElement(id, img, '흐릿한 하늘', '대기가 흔들릴 거예요'); break;
        case 3: setGridElement(id, img, '차단됨', '빛이 차단됐어요'); break;
    }
    setGridElemLoaded(id);
}

function displayPrecipitation(falling) {
    const id = "#resRain";
    switch (falling) {
        case 'rain': setGridElement(id, 'rainy', '비', '비가 내릴 거예요'); break;
        case 'snow': setGridElement(id, 'snowy', '눈', '눈이 내릴 거예요'); break;
        case 'none': setGridElement(id, 'moon with cloud', '강수 없음', '비는 오지 않아요'); break;
    }
    setGridElemLoaded(id);
}

function displayInstability(iLevel) {
    const id = "#resInstability";
    const img = "thunderbolt"
    switch (iLevel) {
        case 0: setGridElement(id, img, '안정', '대기가\n안정적이에요'); break;
        case 1: setGridElement(id, img, '우르릉..', '대기가 조금\n불안정해요'); break;
        case 2: setGridElement(id, img, '불안정', '대기가\n불안정해요'); break;
        case 3: setGridElement(id, img, '섬광폭풍', '번개가\n잔뜩 칠 거예요'); break;
    }
    setGridElemLoaded(id);
}

function displayHumidWind(humid, wSpeed, wDir) {
    const id = "#resHumidWind";
    const img = "humidity and wind"
    let humidInfo;
    let windInfo;
    switch (humid) {
        case 20: humidInfo = '바싹 마름'; break;
        case 100: humidInfo = '물 속'; break;
        default: humidInfo = humid + '%'; break;
    }
    switch (wSpeed) {
        case 0: windInfo = '무풍'; break;
        case 35: windInfo = '폭풍'; break;
        default: windInfo = `약 ${wSpeed}m/s ${wDir}`; break;
    }

    setGridElement(id, img, '상대습도 / 바람', `${humidInfo} / ${windInfo}`);
    setGridElemLoaded(id);
}

// 갱신 필요를 확인하고 응답을 로컬에 저장 혹은 불러오기.
// 로딩 화면과 결과 화면 갱신.
async function displayWeather() {
    if (isNeedRefresh()) {
        const coord = await getCoord();
        if (!coord) return;
        let weatherFull = await getWeather(coord);
        if (!weatherFull) return;
        localStorage.setItem('weather', JSON.stringify(weatherFull));
    }
    let weather;
    if (dayNight.day) weather = new Weather(JSON.parse(localStorage.getItem('weather')), 12);
    else weather = new Weather(JSON.parse(localStorage.getItem('weather')));

    divLoading.style.display = 'none';
    divResult.style.display = 'grid';

    let dayOffset;
    if(new Date().getHours() < 12 && dayNight.day) dayOffset = "오늘";
    else dayOffset = "내일";

    setSubtitle(`${dayOffset} ${weather.timepoint % 24}시 기준\n기온 ${weather.temperature}℃`);
    setTimeout(() => { displayCloudLevel(weather.cloudLevel) }, 100);
    setTimeout(() => { displayStarLevel(weather.starLevel) }, 200);
    setTimeout(() => { displayTransparency(weather.transparency) }, 300);
    setTimeout(() => { displayPrecipitation(weather.prec) }, 400);
    setTimeout(() => { displayInstability(weather.instability) }, 500);
    setTimeout(() => { displayHumidWind(weather.humidity, weather.windPower, weather.windDirection) }, 600);
}

// 밤 낮 모드 토글 버튼.
// 전환 마다 문구를 갱신하고 이미지 전환과 색 설정용 클래스 지정.
function toggleMode(e) {
    e.preventDefault();
    dayNight.day = !dayNight.day;
    divLoading.style.display = 'block';
    divResult.style.display = 'none';
    if (dayNight.day) {
        setTitle("Radiant Skies");
        setSubtitle("오늘 날씨가 좋을까요?");
        setBackImage("DALLE day", "blue sky background");
        document.body.classList.remove("night");
        [...document.getElementsByTagName("div")].forEach(d => d.classList.remove("night"));
        document.querySelectorAll(".weatherDesc").forEach(d => d.classList.remove("night"));
        resetGridElemLoaded();
        displayWeather();
        document.querySelectorAll("#modeButton").forEach(d => d.classList.remove("night"));
        document.querySelectorAll("#loadStatus.onLoading").forEach(d => d.classList.remove("night"));
    }
    else {
        setTitle("Starry Night");
        setSubtitle("오늘의 밤하늘은 어떨까요?");
        setBackImage("DALLE star2", "starry night background");
        document.body.classList.add("night");
        [...document.getElementsByTagName("div")].forEach(d => d.classList.add("night"));
        document.querySelectorAll(".weatherDesc").forEach(d => d.classList.add("night"));
        resetGridElemLoaded();
        displayWeather();
        document.querySelectorAll("#modeButton").forEach(d => d.classList.add("night"));
        document.querySelectorAll("#loadStatus.onLoading").forEach(d => d.classList.add("night"));
    }
}

// 초기화면 설정. 기본 화면은 밤.
function init() {
    divResult.style.display = 'none';
    setLoadingMessage('불러오는 중...');
    setTitle("Starry Night");
    setSubtitle("오늘의 밤하늘은 어떨까요?");
    setBackImage("DALLE star2", "starry night background");
    document.body.classList.add("night");
    [...document.getElementsByTagName("div")].forEach(d => d.classList.add("night"));
    document.querySelectorAll(".weatherDesc").forEach(d => d.classList.add("night"));
    resetGridElemLoaded();
    displayWeather();
    document.querySelectorAll("#modeButton").forEach(d => d.classList.add("night"));
    document.querySelectorAll("#loadStatus.onLoading").forEach(d => d.classList.add("night"));
    modeButton.addEventListener('click', (e) => toggleMode(e));
}

init();