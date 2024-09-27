let iceCreamFlavors = [
    { name: "Chocolate", type: "Chocolate", price: 2 },
    { name: "Strawberry", type: "Fruit", price: 1 },
    { name: "Vanilla", type: "Vanilla", price: 2 },
    { name: "Pistachio", type: "Nuts", price: 1.5 },
    { name: "Neapolitan", type: "Chocolate", price: 2},
    { name: "MintChip", type: "Chocolate", price: 1.5 },
    { name: "Raspberry", type: "Fruit", price: 1},
    ];

let transactions = [];
transactions.push({ scoops: ["Chocolate", "Vanilla", "MintChip"], total: 5.5 })
transactions.push({ scoops: ["Raspberry", "StrawBerry"], total: 2 })
transactions.push({ scoops: ["Vanilla", "Vanilla"], total: 4 })

const total = transactions.reduce((acc, curr) => acc + curr.total, 0);
console.log(`You've made ${total}$ today`)

let flavorDistribution = transactions.reduce((acc, curr) => {
        curr.scoops.forEach(scoop => {
            if (!acc[scoop]) {
                acc[scoop] = 0;
            }
            acc[scoop]++;
        })
        return acc;
    }, {}) // { Chocolate: 1, Vanilla: 3, Mint Chip: 1, Raspberry: 1, StrawBerry: 1 }
console.log(flavorDistribution);

//최대값
let most = -1;
//최대값의 이름
let mostPick = "Unknown";
//키를 뽑아내어 flavorDistribution에 순차접근. 현재 최대값보다 이번 값이 크면 최대값과 그 이름을 갱신.
Object.keys(flavorDistribution).forEach((value) => {
    if(flavorDistribution[value] > most) {
        most = flavorDistribution[value];
        mostPick = value;
    }
})

//최대값 이름 출력
console.log(mostPick);