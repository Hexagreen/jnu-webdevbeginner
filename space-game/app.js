class EventEmitter {
    constructor() {
        this.listeners = {};
    }
    on(message, listener) {
        if (!this.listeners[message]) {
            this.listeners[message] = [];
        }
        this.listeners[message].push(listener);
    }
    emit(message, payload = null) {
        if (this.listeners[message]) {
            this.listeners[message].forEach((l) => l(message, payload));
        }
    }
}

class GameObject {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.dead = false;     // 객체가 파괴되었는지 여부
        this.type = "";        // 객체 타입 (영웅/적)
        this.width = 0;        // 객체의 폭
        this.height = 0;       // 객체의 높이
        this.img = undefined;  // 객체의 이미지
    }
    draw(ctx) {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height); // 캔버스에 이미지 그리기
    }
}

class Hero extends GameObject {
    constructor(x, y) {
        super(x, y);
        (this.width = 99), (this.height = 75);
        this.type = 'Hero';
        this.speed = { x: 0, y: 0 };
    }
}

class Enemy extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 98;
        this.height = 50;
        this.type = "Enemy";
        // 적 캐릭터의 자동 이동 (Y축 방향)
        let id = setInterval(() => {
            if (this.y < canvas.height - this.height) {
                this.y += 5;  // 아래로 이동
            } else {
                console.log('Stopped at', this.y);
                clearInterval(id); // 화면 끝에 도달하면 정지
            }
        }, 300);
    }
}

let onKeyDown = function (e) {
    console.log(e.keyCode);
    switch (e.keyCode) {
        case 37: // 왼쪽 화살표
        case 39: // 오른쪽 화살표
        case 38: // 위쪽 화살표
        case 40: // 아래쪽 화살표
        case 32: // 스페이스바
            e.preventDefault();
            break;
        default:
            break;
    }
};
window.addEventListener('keydown', onKeyDown);

window.addEventListener("keyup", (evt) => {
    if (evt.key === "ArrowUp") {
        eventEmitter.emit(Messages.KEY_EVENT_UP);
    } else if (evt.key === "ArrowDown") {
        eventEmitter.emit(Messages.KEY_EVENT_DOWN);
    } else if (evt.key === "ArrowLeft") {
        eventEmitter.emit(Messages.KEY_EVENT_LEFT);
    } else if (evt.key === "ArrowRight") {
        eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
    }
});

const Messages = {
    KEY_EVENT_UP: "KEY_EVENT_UP",
    KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
    KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
    KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
};
let heroImg, enemyImg, laserImg,
    canvas, ctx,
    gameObjects = [], hero,
    eventEmitter = new EventEmitter();

function loadTexture(path) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = path;
        img.onload = () => {
            resolve(img);
        };
    })
}


function initGame() {
    gameObjects = [];
    createEnemies();
    createHero();
    eventEmitter.on(Messages.KEY_EVENT_UP, () => {
        hero.y -= 5;
    })
    eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
        hero.y += 5;
    });
    eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
        hero.x -= 5;
    });
    eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
        hero.x += 5;
    });
}

window.onload = async () => {
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext("2d");
    heroImg = await loadTexture("assets/player.png");
    enemyImg = await loadTexture("assets/enemyShip.png");
    pattern = ctx.createPattern(await loadTexture("assets/starBackground.png"), "repeat");

    initGame();
    let gameLoopId = setInterval(() => {
        // 화면 초기화
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // 게임 객체 그리기
        drawGameObjects(ctx);
    }, 100); // 200ms마다 실행
};

function drawGameObjects(ctx) {
    gameObjects.forEach(go => go.draw(ctx));
}

function createHero() {
    hero = new Hero(
        canvas.width / 2 - 45,
        canvas.height - canvas.height / 4
    );
    hero.img = heroImg;
    gameObjects.push(hero);
}

function createBuddy(ctx, heroImg, heroX, heroY) {
    ctx.drawImage(heroImg, heroX - heroImg.width * 0.75, heroY + heroImg.height * 0.2, heroImg.width / 2, heroImg.height / 2);
    ctx.drawImage(heroImg, heroX + heroImg.width * 1.25, heroY + heroImg.height * 0.2, heroImg.width / 2, heroImg.height / 2);
}

function createEnemies() {
    const MONSTER_TOTAL = 5;
    const MONSTER_WIDTH = MONSTER_TOTAL * 98;
    const START_X = (canvas.width - MONSTER_WIDTH) / 2;
    const STOP_X = START_X + MONSTER_WIDTH;

    for (let x = START_X; x < STOP_X; x += 98) {
        for (let y = 0; y < 50 * 5; y += 50) {
            const enemy = new Enemy(x, y);
            enemy.img = enemyImg;
            gameObjects.push(enemy);
        }
    }
}

function createEnemies2(ctx, canvas, enemyImg) {
    const MONSTER_TOTAL = 5;
    let MONSTER_WIDTH = MONSTER_TOTAL * enemyImg.width;
    let START_X = (canvas.width - MONSTER_WIDTH) / 2;
    let STOP_X = START_X + MONSTER_WIDTH;

    for (let y = 0; y < enemyImg.height * 5; y += enemyImg.height) {
        for (let x = START_X; x < STOP_X; x += enemyImg.width) {
            ctx.drawImage(enemyImg, x, y);
        }
        START_X += enemyImg.width * 0.5;
        STOP_X -= enemyImg.width * 0.5;
    }

}