let card1 = 7;
let card2 = 5;
let card3 = 9;
let sum = card1 + card2;

//딜러가 뽑게될 카드들
let banks = [7, 5, 6, 4];

//게임 종료 시 true
function checkGameSet() {
    if(sum === 21) {
        console.log("BLACKJACK");
        return true;
    }
    else if(sum > 21) {
        console.log('BUST');
        return true;
    }
    return false;
}

//카드 2개로 게임 종료 체크. 끝나지 않았다면, 한 장 더 뽑아본다.
if(!checkGameSet()) {
    sum += card3;
    checkGameSet();
}
console.log(`You have ${sum} points`);

//딜러가 카드를 뽑을 차례. 17 미만이면 계속 뽑아본다.
let bankSum = 0;
let i = 0;
while(bankSum < 17) {
    bankSum += banks[i++];
}

//딜러가 버스트 or 플레이어가 딜러보다 높음 = 승리
//같은 점수 = 무승부
//그 외 = 패배
if(bankSum > 21 || (sum <= 21 && sum > bankSum)) {
    console.log("You win");
}
else if(bankSum === sum) {
    console.log("Draw");
}
else {
    console.log("Bank wins");
}