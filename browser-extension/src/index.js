import axios from 'axios';
// fyCFxtikrJ5So
// form fields
const form = document.querySelector('.form-data');
const region = document.querySelector('.region-name');
const apiKey = document.querySelector('.api-key');
// results
const errors = document.querySelector('.errors');
const loading = document.querySelector('.loading');
const results = document.querySelector('.result-container');
const usage = document.querySelector('.carbon-usage');
const fossilfuel = document.querySelector('.fossil-fuel');
const myregion = document.querySelector('.my-region');
const clearBtn = document.querySelector('.clear-btn');

const calculateColor = async (value) => {
    let co2Scale = [0, 150, 600, 750, 800];
    let colors = ['#2AA364', '#F5EB4D', '#9E4229', '#381D02', '#381D02'];
    let closestNum = co2Scale.sort((a, b) => {
        return Math.abs(a - value) - Math.abs(b - value);
    })[0];
    console.log(value + ' is closest to ' + closestNum);
    let num = (element) => element > closestNum;
    let scaleIndex = co2Scale.findIndex(num);
    let closestColor = colors[scaleIndex];
    console.log(scaleIndex, closestColor);
    chrome.runtime.sendMessage({ action: 'updateIcon', value: { color: closestColor } });
};


async function displayCarbonUsage(apiKey, region) {
    let __region = region.split(/[, ]/);
    let __cIntense = [];
    let __fossPercent = [];
    let firstCarbonIntense;

    for (let i = 0; i < __region.length; i++) {
        let regionElem = __region[i];
        try {
            await axios
                .get('https://api.co2signal.com/v1/latest', {
                    params: {
                        countryCode: regionElem,
                    },
                    headers: {
                        //please get your own token from CO2Signal https://www.co2signal.com/
                        'auth-token': apiKey,
                    },
                })
                .then((response) => {
                    if (firstCarbonIntense === null) {
                        firstCarbonIntense = Math.floor(response.data.data.carbonIntensity);
                    }
                    __cIntense.push(Math.round(response.data.data.carbonIntensity) + ' g');
                    __fossPercent.push(response.data.data.fossilFuelPercentage.toFixed(2) + '%');
                    successed();
                });
        } catch (error) {
            __fossPercent.push("Error");
            failed(error);
            errors.textContent = 'Sorry, we have no data for some region you have requested.';
        }
    }

    function successed() {
        calculateColor(firstCarbonIntense);
        loading.style.display = 'none';
        form.style.display = 'none';
        clearBtn.style.display = 'inline';
        myregion.textContent = __region.join(" || ");
        usage.textContent = __cIntense.join(" || ");
        fossilfuel.textContent = __fossPercent.join(" || ");
        results.style.display = 'block';
    }

    function failed(error) {
        console.log(error);
        loading.style.display = 'none';
        myregion.textContent = __region.join(" || ");
        usage.textContent = __cIntense.join(" || ");
        fossilfuel.textContent = __fossPercent.join(" || ");
        // results.style.display = 'none';
    }
}

function setUpUser(apiKey, regionName) {
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('regionName', regionName);
    loading.style.display = 'block';
    errors.textContent = '';
    displayCarbonUsage(apiKey, regionName);
}

function handleSubmit(e) {
    e.preventDefault();
    setUpUser(apiKey.value, region.value);
}

function init() {
    const storedApiKey = localStorage.getItem('apiKey');
    const storedRegion = localStorage.getItem('regionName');

    chrome.runtime.sendMessage({
        action: 'updateIcon',
        value: {
            color: 'green',
        },
    });

    if (storedApiKey === null || storedRegion === null) {
        form.style.display = 'block';
        results.style.display = 'none';
        loading.style.display = 'none';
        clearBtn.style.display = 'none';
        errors.textContent = '';
    } else {
        displayCarbonUsage(storedApiKey, storedRegion);
        results.style.display = 'block';
        form.style.display = 'none';
        clearBtn.style.display = 'inline';
    }
}

function reset(e) {
    e.preventDefault();
    localStorage.removeItem('regionName');
    init();
}

form.addEventListener('submit', (e) => handleSubmit(e));
clearBtn.addEventListener('click', (e) => reset(e));
init();