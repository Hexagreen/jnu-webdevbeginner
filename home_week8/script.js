// all of our quotes
const quotes = [
    'When you have eliminated the impossible, whatever remains, however improbable, must be the truth.',
    'There is nothing more deceptive than an obvious fact.',
    'I ought to know by this time that when a fact appears to be opposed to a long train of deductions it invariably proves to be capable of bearing some other interpretation.',
    'I never make exceptions. An exception disproves the rule.',
    'What one man can invent another can discover.',
    'Nothing clears up a case so much as stating it to another person.',
    'Education never ends, Watson. It is a series of lessons, with the greatest for the last.',
    'Ad astra per aspera.',
    'Pecunia, si utis scis, ancilla est; si nescis, domina.',
    'Doscendo discimus.',
    'In absentia lucis, tenebrae vincunt.',
    'Veritas liberabit vos.',
    'Cogito ergo sum.',
    'Vanitas vanitatum et omnia vanitas.',
    'If everything in life is futile, then what is the point in struggling?',
    'I will answer that question with my entire life.',
];

const translations = [
    '불가능한 것을 모두 제거하고 나면 남는 것은 아무리 불가능해 보일지라도 진실이다. [The Sign of Four]',
    '분명한 사실만큼 속기 쉬운 것은 없다. [The Adventures of Sherlock Holmes]',
    '이제는 알아야 할 때다. 오랜 추론 과정에 반하는 사실이 나타날 때, 그 사실은 언제나 다른 해석의 여지를 품고 있음을. [The Hound of the Baskervilles]',
    '나는 예외를 두지 않는다. 예외는 규칙을 무너뜨리니까. [The Adventures of Sherlock Holmes]',
    '한 사람이 발명한 것은 다른 사람이 발견할 수 있다. [The Adventures of Sherlock Holmes]',
    '다른 사람에게 설면하는 것만큼 사건을 명확히 하는 방법은 없다. [The Memoirs of Sherlock Holmes]',
    '교육은 끝나지 않아, 왓슨. 교육은 연속된 수업이며, 마지막에 가장 위대한 것이 있다네. [His Last Bow]',
    '역경을 넘어 별을 향해',
    '돈을 다루는 법을 알면 돈은 노예가 되지만, 사용할 줄 모르면 돈은 주인이 된다.',
    '가르치면서, 우리는 배우게 된다.',
    '빛이 없는 곳은, 어둠이 지배하게 된다.',
    '진리가 너희를 자유케 하리라',
    '나는 생각한다, 고로 존재한다.',
    '헛되고 헛되나니, 모든 것이 헛되도다.',
    '삶이 결국 덧없을 운명이라면, 몸부림에 무슨 의미가 있을까?',
    '나는 내 평생을 다해 그 질문에 답하겠노라.',
];

// store the list of words and the index of the word the player is currently typing
let words = [];
let wordIndex = 0;
// the starting time
let startTime = Date.now();
let wordLength = 0;
// page elements
const quoteElement = document.getElementById('quote');
const typedValueElement = document.getElementById('typed-value');
const modal = document.getElementById('modal');
const sound = document.getElementById('sfx');
const endSound = document.getElementById('endsfx');
sound.volume = 0.3;
endSound.volume = 0.5;

function textboxToggle() {
    typedValueElement.disabled = !typedValueElement.disabled
}

function openModal() {
    modal.classList.add("on");
}

function closeModal() {
    modal.classList.remove("on")
    modal.style.display = "none";
}

function setModalTitle(title) {
    document.getElementById("popupTitle").innerHTML = title;
}

function setModalText(text) {
    document.getElementById("popupText").innerHTML = text;
}

function displayModalRank() {
    document.getElementById("rank").innerHTML = framingRecord().join('');
}

function findLastWord(words) {
    let len = words.length;
    for (let i = len - 1; 0 < i; i--) {
        if (/\W+/.test(words[i])) return i - 1;
    }
    return len - 1;
}

function initRecord() {
    if(readRecord() === null) {
        let initial = [];
        window.localStorage.setItem('record', JSON.stringify(initial));
    }
}

function readRecord() {
    return JSON.parse(window.localStorage.getItem('record'));
}

function saveRecord(newRecord) {
    let record = readRecord();
    record.push(newRecord);
    record.sort((a, b) => b - a);
    record = record.splice(0, 10);
    let strRecord = JSON.stringify(record);
    window.localStorage.setItem('record', strRecord);
}

function framingRecord() {
    let records = readRecord();
    let rank = 1;
    return records.map((record) => {
        if(rank < 4) {
            return `<tr class="grade" id="grade${rank}"><td>${rank++}</td><td class="point">${record} type/sec</td></tr>`;
        }
        return `<tr class="grade"><td>${rank++}</td><td class="point">${record} type/sec</td></tr>`;
    });
}

document.getElementById('start').disabled = false;
typedValueElement.disabled = true;

initRecord();
setModalTitle("Typing game");
setModalText("Click [Start] button to begin!")
displayModalRank();
openModal();
if(document.getElementById('rank').innerHTML === '') document.getElementById('rank').style.display = "none";

// at the end of script.js
document.getElementById('start').addEventListener('click', () => {
    textboxToggle();
    closeModal();
    document.getElementById('quoteBox').style.borderStyle = "solid";
    document.getElementById('rank').style.display = "table";
    // get a quote
    const quoteIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[quoteIndex].replaceAll(/ /g, " |||").replaceAll(/([^ \w|])/g, "|||$1");
    const translation = translations[quoteIndex];
    wordLength = quotes[quoteIndex].replaceAll(/\W/g, "").length;
    // Put the quote into an array of words
    words = quote.split('|||');
    // reset the word index for tracking
    wordIndex = 0;

    // UI updates
    // Create an array of span elements so we can set a class
    const spanWords = words.map(function (word) { return `<span>${word}</span>` });
    // Convert into string and set as innerHTML on quote display
    quoteElement.innerHTML = spanWords.join('');
    // Highlight the first word
    quoteElement.childNodes[0].className = 'highlight';
    document.getElementById('trans').innerHTML = translation;
    // Setup the textbox
    // Clear the textbox
    typedValueElement.value = '';
    // set focus
    typedValueElement.focus();
    // set the event handler

    // Start the timer
    startTime = new Date().getTime();
});

// at the end of script.js
typedValueElement.addEventListener('input', () => {
    // Get the current word
    const currentWord = words[wordIndex];
    // get the current value
    const typedValue = typedValueElement.value;
    sound.currentTime = 0;
    sound.play();
    const nowQuote = quoteElement.childNodes[wordIndex];
    nowQuote.classList.add('shaking');
    nowQuote.addEventListener('animationend', () => {
        nowQuote.classList.remove('shaking');
    });
    modal.style.display = "block";
    if (typedValue === currentWord && wordIndex === findLastWord(words)) {
        // end of sentence
        // Display success
        endSound.currentTime = 0;
        endSound.play()
        const elapsedTime = new Date().getTime() - startTime;
        const typePerSec = Math.round(wordLength / (elapsedTime / 1000) * 100) / 100;
        saveRecord(typePerSec);
        textboxToggle();
        setModalTitle("CONGRATULATIONS!");
        setModalText(`You finished in ${elapsedTime / 1000} seconds. (${typePerSec} type/sec)`);
        displayModalRank();

        document.getElementById('start').innerHTML = "Retry";
        openModal();
    } else if (typedValue.endsWith(' ') && typedValue.trim() === currentWord.trim()) {
        // end of word
        // clear the typedValueElement for the new word
        typedValueElement.value = '';
        // move to the next word
        wordIndex++;
        if (/\W+/.test(words[wordIndex].trim())) wordIndex++;
        // reset the class name for all elements in quote
        for (const wordElement of quoteElement.childNodes) {
            wordElement.className = '';
        }
        // highlight the new word
        quoteElement.childNodes[wordIndex].className = 'highlight';
    } else if (currentWord.startsWith(typedValue)) {
        // currently correct
        // highlight the next word
        typedValueElement.className = '';
    } else {
        // error state
        typedValueElement.className = 'error';
    }
});
