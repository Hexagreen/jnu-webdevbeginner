import axios from 'axios';

const hTitle = document.querySelector("#title");
const hSubtitle = document.querySelector("#subtitle")
const divLoading = document.querySelector(".loading");
const divResult = document.querySelector(".result");

class Coordinate {
    constructor(x, y) {
        this.latitude = Math.round(x * 100) / 100;
        this.longitude = Math.round(y * 100) / 100;
    }
}

class Weather {
    constructor(forecast) {
        const date = new Date();
        const nowLocalTime = date.getHours();
        const hoursToMidnight = 24 - nowLocalTime;
        const midnightInUTC = date.getUTCHours() + hoursToMidnight;
        const initTime = parseInt(forecast.init) % 100;
        let initTimeToMidnightInUTC = midnightInUTC - initTime;
        initTimeToMidnightInUTC = initTimeToMidnightInUTC === 0 ? 24 : initTimeToMidnightInUTC;
        let timepointIndex = Math.round(initTimeToMidnightInUTC / 3.0) - 1;
        if (timepointIndex < 0) timepointIndex = 0;

        const target = forecast.dataseries[timepointIndex];
        this.timepoint = target.timepoint + initTime - (date.getTimezoneOffset / 60);
        this.cloudLevel = getCloudLevel();      //0: completly clear 1: little bit 2: cloudy 3: filled
        this.starLevel = getStarLevel();        //0: faint star 1: dark star 2: bright star 3: brightest star
        this.transparency = getTransparency();  //0: clear 1: thin 2: thick 3: blocked
        this.instability = getInstability();    //0: stable 1: little bit 2: unstable 3: thunderstorm
        this.prec = target.prec_type;           //"rain" "snow" "none"
        this.humidity = getHumidity();          //20: desert 100: fish pond
        this.windPower = getWindSpeed();        //0: no wind 35: ahhhhhh
        this.windDirection = target.wind10m.direction;
        this.temperature = target.temp2m;       //celcius

        function getCloudLevel() {
            switch (target.timepoint) {
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
            switch (target.seeing) {
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

function setTitle(message) {
    hTitle.innerText = message;
}

function setSubtitle(message) {
    hSubtitle.innerText = message;
}

function setLoadingMessage(message) {
    const info = divLoading.querySelector("#loadInfo");
    info.innerText = message;
}

function setLoadStatFailed() {
    const stat = divLoading.querySelector("#loadStatus");
    stat.classList.replace('onLoaing', 'failed');
}

function isNeedRefresh() {
    if(localStorage.getItem('weather')) return true;
    const lastTime = localStorage.getItem('baseTime');
    const now = new Date();
    const nowTime = '' + now.getUTCFullYear() + (now.getUTCMonth() + 1) + now.getUTCDate() + now.getUTCHours();
    if (lastTime === null || parseInt(nowTime) - parseInt(lastTime) > 6) {
        localStorage.setItem('baseTime', nowTime);
        return true;
    }
    return false;
}

async function getIP() {
    setLoadingMessage("IP 주소 확인 중...")
    try {
        await axios
            .get('https://api.myip.com')
            .then((response) => {
                return response.data.ip;
            });
    } catch (error) {
        setLoadingMessage("외부 IP주소를 받아오지 못했습니다.");
        setLoadStatFailed();
        return null;
    }
}

async function getCoord(ip) {
    setLoadingMessage("위치 정보 파악 중...")
    try {
        await axios
            .get(`http://ip-api.com/json/${ip}`)
            .then((response) => {
                return new Coordinate(response.data.lat, response.data.lon)
            });
    } catch (error) {
        setLoadingMessage("IP 기반 위치정보 파악에 실패했습니다.");
        setLoadStatFailed();
        return null;
    }
}

async function getWeather(coord) {
    setLoadingMessage("날씨 정보 불러오는 중...")
    try {
        await axios
            .get('http://www.7timer.info/bin/api.pl', {
                params: {
                    lon: coord.longitude,
                    lat: coord.latitude,
                    product: 'astro',
                    output: 'json'
                }
            })
            .then((response) => {
                return response.data;
            });
    } catch (error) {
        setLoadingMessage("날씨 정보를 받아오지 못했습니다.");
        setLoadStatFailed();
        return null;
    }
}

function setGridElement(id, imgName, status, desc) {
    divResult.querySelector(id).innerHTML =
        `<img class='statIcon' src='./images/icons/${imgName}.png' alt='${imgName}'></img>
    <p class='weatherStat'>${status}</p>
    <p class='weatherDesc'>${desc}</p>`;
}

function displayCloudLevel(cLevel) {
    const id = "#resCloud";
    switch(cLevel) {
        case 0: setGridElement(id, 'moon', '청명', '구름 한 점 없어요'); break;
        case 1: setGridElement(id, 'moon', '구름 조금', '맑은 하늘이에요'); break;
        case 2: setGridElement(id, 'moon with cloud', '구름 많음', '구름이 꼈어요'); break;
        case 3: setGridElement(id, 'clouds', '구름 가득', '온통 구름이에요'); break;
    }
}

function displayStarLevel(sLevel) {
    const id = "#resSeeing";
    switch(sLevel) {
        case 0: setGridElement(id, 'faint star', '가득한 별', '잘 안보이던 별도 보일 거예요'); break;
        case 1: setGridElement(id, 'dark star', '많은 별', '어두운 별도 보일 거예요'); break;
        case 2: setGridElement(id, 'bright star', '밝은 별만', '어두운 별은 안 보여요'); break;
        case 3: setGridElement(id, 'bright star', '낮은 시계', '밝은 별만 보일 거예요'); break;
    }
}

function displayTransparency(tLevel) {
    const id = "#resTransparency";
    const img = "solar ray penetrate cloud";
    switch(tLevel) {
        case 0: setGridElement(id, img, '투명한 하늘', '하늘이 선명히 보여요'); break;
        case 1: setGridElement(id, img, '맑은 하늘', '투과율이 높아요'); break;
        case 2: setGridElement(id, img, '흐릿한 하늘', '대기가 흔들릴 거예요'); break;
        case 3: setGridElement(id, img, '차단됨', '빛이 차단됐어요'); break;
    }
}

function displayPrecipitation(falling) {
    const id = "#resRain";
    switch(falling) {
        case 'rain': setGridElement(id, 'rainy', '비', '비가 내릴 거예요'); break;
        case 'snow': setGridElement(id, 'snowy', '눈', '눈이 내릴 거예요'); break;
        case 'none': setGridElement(id, 'moon with cloud', '강수 없음', '비는 오지 않아요'); break;
    }
}

function displayInstability(iLevel) {
    const id = "#resInstability";
    const img = "thunderbolt"
    switch(iLevel) {
        case 0: setGridElement(id, img, '안정', '대기가 안정적이에요'); break;
        case 1: setGridElement(id, img, '우르릉..', '대기가 조금 불안정해요'); break;
        case 2: setGridElement(id, img, '불안정', '대기가 불안정해요'); break;
        case 3: setGridElement(id, img, '섬광폭풍', '번개가 잔뜩 칠 거예요'); break;
    }
}

function displayHumidWind(humid, wSpeed, wDir) {
    const id = "#resHumidWind";
    const img = "humidity and wind"
    let humidInfo;
    let windInfo;
    switch(humid) {
        case 20: humidInfo = '바싹 마름'; break;
        case 100: humidInfo = '물 속'; break;
        default: humidInfo = humid + '%'; break;
    }
    switch(wSpeed) {
        case 0: windInfo = '무풍'; break;
        case 35: windInfo = '폭풍'; break;
        default: windInfo = `약 ${wSpeed}m/s ${wDir}`; break;
    }

    setGridElement(id, img, '습도와 바람', `${humidInfo} / ${windInfo}`);
}

function displayTemperature(sLevel) {
    const id = "#resSeeing";
    switch(sLevel) {
        case 0: setGridElement(id, );
        case 1: setGridElement(id, );
        case 2: setGridElement(id, );
        case 3: setGridElement(id, );
    }
}

function init() {
    let weather;
    if(isNeedRefresh()) {
        const ip = getIP();
        if (ip === null) return;
        const coord = getCoord(ip);
        if (coord === null) return;
        const astro = getWeather(coord);
        weather = new Weather(astro);
        localStorage.setItem('weather', JSON.stringify(weather));
    }
    else {
        weather = JSON.parse(localStorage.getItem('weather'));
    }

    divLoading.style.display = 'none';
    divResult.style.display = 'grid';

    setSubtitle(`내일 ${weather.timepoint}시 기준\n기온 ${weather.temperature}℃`);
    displayCloudLevel(weather.cloudLevel);
    displayStarLevel(weather.starLevel);
    displayTransparency(weather.transparency);
    displayPrecipitation(weather.prec);
    displayInstability(weather.instability);
    displayHumidWind(weather.humidity, weather.windPower, weather.windDirection);
}

divResult.style.display = 'none';
setLoadingMessage('불러오는 중...');
init();