// 이벤트 관리자. 이벤트의 구독을 신청받고,
// 이벤트를 구독하도록 한 대상들에게 이벤트가 발생했을 때,
// 어떤 이벤트가 발생했는지 신호를 보내는 클래스.
class EventEmitter {
    // 클래스 생성 시 리스너(=구독자) 딕셔너리 생성
    constructor() {
        this.listeners = {};
    }

    // 이벤트를 구독할 때 사용하는 메서드.
    // 이 메서드 호출 시에 이벤트 이름과 이벤트 발생 시 동작할 함수를 인수로 넣어야 함.
    // 예시: on(Messages.KEY_EVENT_UP, function(message, payload)) ; 동작할 함수의 형식과 작동 방식은 나중에 설명
    on(message, listener) {
        // 리스너 딕셔너리에 인수로 들어온 이벤트 이름(message)이 없으면
        if (!this.listeners[message]) {
            // 빈 배열을 값으로 갖는 키-값을 생성하고 (예시: {"KEY_EVENT_UP":[]} )
            this.listeners[message] = [];
        }
        // 리스너 딕셔너리에 인수로 들어온 이벤트 이름 항목의 값에 인수로 들어온 동작할 함수를 넣어둠.
        // 예시: {"KEY_EVENT_UP":[function(message, payload)]}
        this.listeners[message].push(listener);
    }

    // 이벤트가 발생한 것을 통지할 때 사용하는 메서드.
    // 이 메서드 호출 시에 발생한 이벤트 이름과 (추가정보가 있다면) 추가정보를 인수로 넣어야 함.
    // 예시: emit(Messages.KEY_EVENT_UP) 혹은 emit(Messages.KEY_EVENT_UP, someInfo)
    // 추가 정보는 위의 함수로 등록한 '동작할 함수'에서 필요한 아무 형식의 값을 넣으면 됨
    emit(message, payload = null) {
        // 리스너 딕셔너리에 인수로 들어온 이벤트 이름(message)이 있으면
        // 예시: {"KEY_EVENT_UP":[function(message, payload)]}
        if (this.listeners[message]) {
            // 해당 항목에 등록된 함수(l) 전체를 순회하며 함수를 실행
            // 예시: function(Messages.KEY_EVENT_UP, someInfo) 를 호출한 것처럼 작동함
            this.listeners[message].forEach((l) => l(message, payload));
        }
        // 없으면 동작 안함
    }

    // 등록된 이벤트를 전부 삭제하는 메서드.
    clear() {
        this.listeners = {};
    }
}

// 이벤트 이름으로 사용할 목록
// 이 딕셔너리에 없는 값도 이벤트 이름으로 사용할 수는 있는데, 여기 등록해두면 꺼내쓰면 되니까 헷갈리지 않음.
const Messages = {
    KEYUP_EVENT_UP: "KEYUP_EVENT_UP",
    KEYUP_EVENT_DOWN: "KEYUP_EVENT_DOWN",
    KEYUP_EVENT_LEFT: "KEYUP_EVENT_LEFT",
    KEYUP_EVENT_RIGHT: "KEYUP_EVENT_RIGHT",
    KEYDOWN_EVENT_UP: "KEYDOWN_EVENT_UP",
    KEYDOWN_EVENT_DOWN: "KEYDOWN_EVENT_DOWN",
    KEYDOWN_EVENT_LEFT: "KEYDOWN_EVENT_LEFT",
    KEYDOWN_EVENT_RIGHT: "KEYDOWN_EVENT_RIGHT",
    KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
    KEY_EVENT_ENTER: "KEY_EVENT_ENTER",
    COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
    COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
    GAME_END_LOSS: "GAME_END_LOSS",
    GAME_STAGE_END: "GAME_STAGE_END",
};

// 전역 변수.
// gameObjects 변수는 배열인데, 여기에 활성화 되어있는 모든 객체를 저장해야 함. (예: gameObjects.push(new Laser(...)))
// 이 변수를 이용해서 화면을 갱신하거나, 사망한 객체를 제외시키거나 할거임.
// eventEmitter 변수는 위에서 정의한 이벤트 관리자임. 이 변수를 이용해서 이벤트 구독과 발생 통지
// 같은 작업을 진행할거임.
let heroImg, enemyImg, laserImg, explosionImg, lifeImg, bossImg,
    heroLeftRollImg, heroRightRollImg,
    canvas, ctx, gameLoopId,
    gameObjects = [],
    hero, buddy1, buddy2,
    eventEmitter = new EventEmitter(),
    stageIdx, points,
    enemySpawnFunctions = [createEnemies, createEnemies2, createEnemies3, createEnemies4, createEnemies5];

// 기본 게임 오브젝트의 형식을 정의하는 클래스
class GameObject {
    // 모든 게임 오브젝트는 자신의 x축 좌표와 y축 좌표를 인수로 받아서 생성되어야 함.
    // 이 클래스를 상속한 객체의 생성자에 super(x, y) 가 호출되어야 한다는 것.
    constructor(x, y) {
        this.x = x;             // x축 좌표
        this.y = y;             // y축 좌표
        this.dead = false;      // 객체가 파괴되었는지 여부
        this.type = "";         // 객체 타입 (영웅/적) ; 더 다양한 타입을 담을 수도 있음
        this.width = 0;         // 객체의 폭
        this.height = 0;        // 객체의 높이
        this.img = undefined;   // 객체의 이미지
    }

    // 해당 게임 오브젝트의 위,왼쪽,아래,오른쪽 경계를 반환하는 메서드
    rectFromGameObject() {
        return {
            top: this.y,
            left: this.x,
            bottom: this.y + this.height,
            right: this.x + this.width,
        };
    }

    // 해당 게임 오브젝트를 그리도록 하는 메서드
    draw(ctx) {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height); // 캔버스에 이미지 그리기
    }

    onHit() { }
}

// 플레이어 객체의 형식
class Hero extends GameObject {
    // 플레이어 객체는 x, y 좌표를 인수로 받고 생성됨.
    constructor(x, y) {
        // 상위 클래스의 생성자를 호출해서 게임 오브젝트의 기본을 만들어 두고
        super(x, y);
        (this.width = 99), (this.height = 75);  // 플레이어 객체의 크기 지정
        this.type = 'Hero';                     // 플레이어 객체의 타입을 Hero로 지정
        this.speed = { x: 0, y: 0 };            // 이동속도 정보. 실습 때 코드에서는 사용하는 곳이 없는 듯
        this.cooldown = 0;                      // 평타 간격의 쿨타임
        this.life = 3;                          // 생명력
    }

    // 사격 시에 호출하는 메서드
    fire() {
        // 쿨다운 확인
        if (this.canFire()) {
            // 레이저 생성. 위에서 설명한 대로 생성된 GameObject는 전부 gameObjects 배열에 저장되어야 함.
            gameObjects.push(new Laser(this.x + 45, this.y - 10));
            // 쿨다운 500ms 설정
            this.cooldown = 500;
            // 쿨다운을 100ms 마다 줄이는 타이머 생성. id 변수에는 이 타이머가 저장됨.
            let id = setInterval(() => {
                // 쿨이 0 이상이면 100 줄이고
                if (this.cooldown > 0) {
                    this.cooldown -= 100;
                    // 아니면 타이머 삭제. 
                } else {
                    clearInterval(id);
                }
            }, 300); // 얘가 타이머 실행 간격임 (ms)
        }
    }

    // 쿨다운 확인용 메서드
    canFire() {
        return this.cooldown === 0; // 쿨다운 상태 확인
    }

    // 라이프 깎일 때 호출되는 메서드
    onHit() {
        // 1점 차감하고
        this.life--;
        // 0이 되어있으면 사망으로 처리
        if (this.life === 0) {
            this.dead = true;
        }
    }

    // 사용되지 않던 speed 값을 사용하여 이동을 구현할 것임
    setSpeed(axle, speedValue) {
        this.speed[axle] = speedValue;
    }

    // draw 호출 마다 speed 값을 사용해서 좌표를 갱신하고, 이동 방향에 따라 기체를 롤링.
    draw(ctx) {
        this.x += this.speed.x;
        this.y += this.speed.y;
        if (this.speed.x < 0) this.img = heroLeftRollImg;
        else if (this.speed.x > 0) this.img = heroRightRollImg;
        else this.img = heroImg;
        super.draw(ctx);
    }
}

// 실습에서 만들라고 한 동료기체를 GameObject를 상속해서 만듦
class Buddy extends GameObject {
    // 동료기는 영웅에 종속되기 때문에 어떤 영웅을 따라다니고 간격은 어디인지를 받고 생성됨.
    constructor(hero, d) {
        // GameObject 클래스 설명에 적힌 대로, super()를 호출할 때, 적절한 x, y 좌표만 있으면 문제 없음.
        // 동료기는 영웅을 따라다녀야 하니까 영웅의 x, y 좌표를 가지고 생성됨.
        // 대신 이 객체를 그리는 함수를 수정해야함. (GameObject의 draw 함수는 자신의 좌표를 이용하는 것이기 때문)
        super(hero.x, hero.y);
        (this.width = 99 / 2), (this.height = 75 / 2);  // 원본 영웅보다 작게
        this.type = 'Buddy';                            // 타입은 Buddy
        this.delta = d;                                 // 동료기를 그리는 위치를 결정할 때 쓰는 변수. -1이면 왼쪽 1번, 1이면 오른쪽 1번.
        this.img = hero.img;                            // 이미지는 영웅의 이미지를 같이 사용함
        // 동료기는 주기적으로 레이저를 쏴야하니 3000ms 타이머를 돌려서 레이저를 쏘는데, 좌표 설정이 조금 번잡함.
        // 자신의 좌표가 영웅의 좌표로 설정되어 있기 때문에, 좌표에 보정 처리를 한 후에 레이저를 생성
        this.id = setInterval(() => {
            gameObjects.push(new Laser(this.x + this.buddyPosAdjust() + 21, this.y - 10)); // 레이저 생성
        }, 3000);
    }

    // GameObject 클래스의 draw 함수를 오버라이드.
    // 위에 생성자 설명에 적은 대로 동료기 객체가 가진 좌표는 영웅의 좌표이기 때문에, 그려지는 위치를 조정할 필요가 있음.
    draw(ctx) {
        // 함수 호출 할 때마다 좌표를 영웅의 현재 좌표로 갱신. 이미지도 받아옴
        this.x = hero.x;
        this.y = hero.y;
        this.img = hero.img;
        // 캔버스에 이미지를 그리면서 위치를 보정함.
        ctx.drawImage(this.img, this.x + this.buddyPosAdjust(), this.y + this.height * 0.5, this.width, this.height);
    }

    // 자신의 위치를 보정할 때 쓰는 메서드.
    // 크기가 절반이기 때문에 0번 위치와 1번 위치는 영웅과 겹치게 됨.
    // 양수의 위치를 한 칸 오른쪽으로 조정하여 겹침 방지.
    buddyPosAdjust() {
        if (this.delta < 0) return this.delta * this.width;
        else return (this.delta + 1) * this.width;
    }
}

// 적 객체
class Enemy extends GameObject {
    // 마찬가지로 자신의 좌표를 받고
    constructor(x, y) {
        // 상위로 넘김
        super(x, y);
        this.width = 98;
        this.height = 50;
        this.type = "Enemy";
        // 적 캐릭터의 자동 이동 (Y축 방향)
        this.id = setInterval(() => {
            if (this.y < canvas.height - this.height) {
                this.y += 5;  // 아래로 이동
            } else {
                this.dead = true;
            }
        }, 300);
    }

    // 파괴 시에 호출하는 메서드
    onHit() {
        // 자신의 이미지를 폭발 이미지로 바꾸고
        this.img = explosionImg;
        // 자신의 타입을 변경하여 폭발 효과가 적인 상태로 충돌함을 방지
        this.type = "Effect"
        // 100ms 뒤에 작동하는 일회성 타이머
        setTimeout(() => {
            // 사망 처리
            this.dead = true;
        }, 100);
    }
}

class Boss extends GameObject {
    // 마찬가지로 자신의 좌표를 받고
    constructor(x, y) {
        // 상위로 넘김
        super(x, y);
        this.width = 91;
        this.height = 91;
        this.type = "Enemy";
        this.life = 30;
        // 보스는 5초마다 적 소환, 체력 5 회복
        this.id = setInterval(() => {
            if (this.life < 30) this.life += 5;
            placeEnemies([[1,0,1,0,1]]);
        }, 5000);
    }

    // 피격 시 체력 1깎음, 체력이 0이 되면 사망처리
    onHit() {
        this.life -= 1;
        if (this.life === 0) {
            this.img = explosionImg;
            this.type = "Effect"
            clearInterval(this.id);
            setTimeout(() => {
                this.dead = true;
            }, 300);
        }
    }
}

// 레이저 객체
class Laser extends GameObject {
    constructor(x, y) {
        super(x, y);
        (this.width = 9), (this.height = 33);
        this.type = 'Laser';
        this.img = laserImg;
        // 레이저도 멋대로 움직여야 하기 때문에 여기서 타이머 설정
        let id = setInterval(() => {
            if (this.y > 0) {
                // 올라가다가
                this.y -= 15;
            } else {
                // 화면을 벗어나면 사망처리, 타이머 제거
                this.dead = true;
                clearInterval(id);
            }
        }, 100)
    }

    onHit() {
        this.dead = true;
    }
}

// 브라우저에서 사용되는 화살표와 스페이스 키를 비활성화하기 위한 메서드
let onKeyDown = function (e) {
    switch (e.key) {
        case "ArrowUp": // 왼쪽 화살표
            e.preventDefault();
            eventEmitter.emit(Messages.KEYDOWN_EVENT_UP);
            break;
        case "ArrowDown": // 오른쪽 화살표
            e.preventDefault();
            eventEmitter.emit(Messages.KEYDOWN_EVENT_DOWN);
            break;
        case "ArrowLeft": // 위쪽 화살표
            e.preventDefault();
            eventEmitter.emit(Messages.KEYDOWN_EVENT_LEFT);
            break;
        case "ArrowRight": // 아래쪽 화살표
            e.preventDefault();
            eventEmitter.emit(Messages.KEYDOWN_EVENT_RIGHT);
            break;
        case " ": // 스페이스바
            e.preventDefault();
            break;
        // 나머지는 통과
        default:
            break;
    }
};
// 키 누름 이벤트 발생 시에 바로 위에서 선언한 메서드를 실행하여 기본 동작 무효화
window.addEventListener('keydown', onKeyDown);

// 키 놓음 이벤트 발생 시에 분기마다 다른 이벤트를 발행하여 이벤트 발생 통지
window.addEventListener("keyup", (evt) => {
    // 이하의 emit 함수는 payload 가 없는 이벤트를 통지.
    if (evt.key === "ArrowUp") {
        eventEmitter.emit(Messages.KEYUP_EVENT_UP);
    } else if (evt.key === "ArrowDown") {
        eventEmitter.emit(Messages.KEYUP_EVENT_DOWN);
    } else if (evt.key === "ArrowLeft") {
        eventEmitter.emit(Messages.KEYUP_EVENT_LEFT);
    } else if (evt.key === "ArrowRight") {
        eventEmitter.emit(Messages.KEYUP_EVENT_RIGHT);
    } else if (evt.key === " ") {
        eventEmitter.emit(Messages.KEY_EVENT_SPACE);
    } else if (evt.key === "Enter") {
        eventEmitter.emit(Messages.KEY_EVENT_ENTER);
    }
});

// 이미지를 로드하도록 하는 비동기 메서드
function loadTexture(path) {
    return new Promise((resolve) => {
        // 이미지 객체를 생성하고
        const img = new Image();
        // 이미지 주소를 지정
        img.src = path;
        // 이미지 로드 후 자동으로 실행되는 메서드에 람다 메서드 등록
        img.onload = () => {
            // 비동기 메서드를 완수
            resolve(img);
        };
    })
}

// 게임 초기화 메서드
function initGame(enemyIdx) {
    // 게임 오브젝트 초기화
    gameObjects = [];
    enemySpawnFunctions[enemyIdx]();    // 적 생성. 스테이지 번호에 맞춰 적 생성
    createHero();       // 영웅 생성
    createBuddy();      // 동료기 생성
    if (enemyIdx == 0) points = 0;
    // 이벤트 등록: 화살표 키가 눌리는 이벤트에 영웅의 좌표를 변경하는 메서드를 등록
    eventEmitter.on(Messages.KEYDOWN_EVENT_UP, () => {
        hero.setSpeed("y", -5);
    });
    eventEmitter.on(Messages.KEYDOWN_EVENT_DOWN, () => {
        hero.setSpeed("y", 5);
    });
    eventEmitter.on(Messages.KEYDOWN_EVENT_LEFT, () => {
        hero.setSpeed("x", -5);
    });
    eventEmitter.on(Messages.KEYDOWN_EVENT_RIGHT, () => {
        hero.setSpeed("x", 5);
    });
    eventEmitter.on(Messages.KEYUP_EVENT_UP, () => {
        hero.setSpeed("y", 0);
    });
    eventEmitter.on(Messages.KEYUP_EVENT_DOWN, () => {
        hero.setSpeed("y", 0);
    });
    eventEmitter.on(Messages.KEYUP_EVENT_LEFT, () => {
        hero.setSpeed("x", 0);
    });
    eventEmitter.on(Messages.KEYUP_EVENT_RIGHT, () => {
        hero.setSpeed("x", 0);
    });
    // 이벤트 등록: 스페이스 바가 눌리는 이벤트에 영웅이 레이저를 쏘는 메서드를 등록
    eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
        hero.fire();
    });
    // 이벤트 등록: 레이저와 적이 충돌하는 이벤트에 딕녀서리 {first:??, second:??}를 payload로 받는 메서드를 등록
    // first와 second의 값에는 실제로 이 이벤트를 발행하는 코드에서 넣어주는 값이 들어올 예정
    // 이 코드에서 second는 실제로 적 객체가 들어오는데, 적의 사망처리를 하는 메서드에서 100ms의 타이머 후에 dead를 true로 바꾸고 있기 때문에
    // 게임 승리 이벤트를 발행하는 코드를 약간 늦춰서 실행할 필요가 있음.
    eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
        first.onHit();          // first의 사망 처리
        second.onHit();            // second의 사망 처리
        points += 100;     // 점수 상승
        if (isEnemiesDead()) {
            // 스테이지 완료 이벤트 발행 (payload 없음)
            eventEmitter.emit(Messages.GAME_STAGE_END);
        }
    });
    // 이벤트 등록: 적과 영웅이 충돌하는 이벤트에 딕셔너리 {enemy:??} 를 payload로 받는 메서드 등록
    eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy }) => {
        enemy.onHit();          // 부딪힌 적을 사망처리 
        hero.onHit();       // 영웅 라이프 감소
        if (isHeroDead()) {
            // 게임 패배 이벤트 발행 (payload 없음)
            eventEmitter.emit(Messages.GAME_END_LOSS);
            return; // 메서드 종료
        }
        // 적이 전부 죽었으면
        if (isEnemiesDead()) {
            // 스테이지 완료 이벤트 발행 (payload 없음)
            eventEmitter.emit(Messages.GAME_STAGE_END);
        }
    });
    // 이벤트 등록: 스테이지 완료 이벤트
    eventEmitter.on(Messages.GAME_STAGE_END, () => {
        nextStage();
    });
    // 이벤트 등록: 게임 패배 이벤트에 endGame 메서드를 실행하는 메서드 등록
    eventEmitter.on(Messages.GAME_END_LOSS, () => {
        endGame(false); // 거짓이면 패배
    });
}

// 브라우저에서 페이지를 로드할 때 자동으로 실행되는 메서드에 비동기 람다 메서드 등록
// 이미지를 로드하는 메서드가 비동기 작업이라
// await 을 사용해서 호출해야하기 때문에 async를 사용하고 있음
window.onload = async () => {
    canvas = document.getElementById("myCanvas");   // 캔버스 받고
    ctx = canvas.getContext("2d");                  // 2d 컨텍스트
    // 각 이미지 로드 시도
    heroImg = await loadTexture("assets/player.png");
    heroLeftRollImg = await loadTexture("assets/playerLeft.png");
    heroRightRollImg = await loadTexture("assets/playerRight.png");
    enemyImg = await loadTexture("assets/enemyShip.png");
    laserImg = await loadTexture("assets/laserRed.png");
    explosionImg = await loadTexture("assets/laserGreenShot.png");
    lifeImg = await loadTexture("assets/life.png");
    bossImg = await loadTexture("assets/enemyUFO.png")
    // 배경 이미지를 로드하면서 바로 반복 패턴으로 변경
    pattern = ctx.createPattern(await loadTexture("assets/starBackground.png"), "repeat");

    stageIdx = 0;
    points = 0;

    // 위에서 본 게임 초기화 메서드
    initGame(stageIdx);
    // 게임 화면이 갱신되며 충돌 감지 같은 지속적인 작업을 처리하는 타이머 생성
    gameLoopId = setInterval(standardGameloop, 100); // 100ms마다 실행
};

// 두 사각형 영역이 겹치는지(=충돌했는지) 검사하는 메서드
// r2가 r1의 바깥쪽에 있는지 검사하고 밖에 있으면 false, 안에 있으면(=겹치면) true 반환
// 웹페이지 화면은 스크린 좌표계를 사용하고 있기 때문에, 왼쪽 위가 (0, 0)이 된다.
// 유니티는 카테시안 좌표계라서 왼쪽 아래가 (0, 0)이라 헷갈릴 수 있음.
function intersectRect(r1, r2) {
    return !(
        r2.left > r1.right ||  // r2가 r1의 오른쪽 바깥에 있음
        r2.right < r1.left ||  // r2가 r1의 왼쪽 바깥에 있음
        r2.top > r1.bottom ||  // r2가 r1의 아래쪽 바깥에 있음
        r2.bottom < r1.top     // r2가 r1의 위쪽 바깥에 있음
    );
}

// gameObjects 배열에 등록된 모든 GameObject 객체를 순회하며 draw 메서드를 호출하는 메서드
// 이 메서드로 게임 객체를 화면에 그리기 때문에 gameObjects 배열에 그려야 하는 모든 객체를 넣어둬야 함
function drawGameObjects(ctx) {
    gameObjects.forEach(go => go.draw(ctx));
}

// 객체 간의 충돌 검사와 사망 객체 제외 작업을 처리하는 메서드
function updateGameObjects() {
    // gameObjects 에 등록된 객체 중 type이 "Enemy"인 객체만 골라서 enemies 지역 상수에 저장
    const enemies = gameObjects.filter((go) => go.type === "Enemy");
    // 마찬가지로 "Laser" 만 골라서 lasers에 저장
    const lasers = gameObjects.filter((go) => go.type === "Laser");
    // lasers 전체를 순회하면서
    lasers.forEach((l) => {
        // enemies 전체를 순회하면서
        enemies.forEach((m) => {
            // 두 객체의 영역이 겹치는지 확인하고
            if (intersectRect(l.rectFromGameObject(), m.rectFromGameObject())) {
                // 겹쳤다면 레이저와 적이 충돌한 이벤트를 발행
                // payload에 부딪힌 레이저와 적을 first, second에 넣어서 보내줌
                // -> 이러면 이벤트에 등록된 함수에서 레이저와 적 객체에 접근할 수 있음
                eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
                    first: l,
                    second: m,
                });
            }
        });
    });
    // enemies 전체를 순회하면서
    enemies.forEach(enemy => {
        // 영웅의 영역..
        const heroRect = hero.rectFromGameObject();
        // ..과 적의 영역이 겹치는지 확인하고
        if (intersectRect(heroRect, enemy.rectFromGameObject())) {
            // 겹쳤으면 영웅과 적이 충돌한 이벤트를 발행
            // 여기서도 payload에 적을 넣어줘서 이벤트에 등록된 함수에서 적 객체에 접근할 수 있음
            eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy });
        }
    })
    // gameObjects 배열에서 dead가 참인 (=죽은) 객체를 필터를 이용해 제거
    gameObjects = gameObjects.filter((go) => !go.dead);
}

// 영웅 생성 메서드
function createHero() {
    // 영웅의 좌표를 적절히 설정해서 생성하고 전역변수 목록에 있는 hero에 저장
    hero = new Hero(
        canvas.width / 2 - 45,
        canvas.height - canvas.height / 4
    );
    // 영웅 이미지 설정하고
    hero.img = heroImg;
    // gameObjects 배열에 담음
    gameObjects.push(hero);
}

// 동료기 생성 메서드
function createBuddy() {
    // 동료기는 생성할 때 영웅 객체와 순번을 받도록 했음
    buddy1 = new Buddy(hero, -1);
    buddy2 = new Buddy(hero, 1);
    // 배열에 담음
    gameObjects.push(buddy1);
    gameObjects.push(buddy2);
}

// 라이프 표시 그리기
function drawLife() {
    const START_POS = canvas.width;
    for (let i = hero.life; i > 0; i--) {
        ctx.drawImage(lifeImg, START_POS - (45 * (i)), canvas.height - 37);
    }
}

// 점수 그리기. 아래의 텍스트 그리기 메서드를 이용
function drawPoints() {
    ctx.font = "30px Arial";
    ctx.fillStyle = "red";
    ctx.textAlign = "left";
    drawText("Points: " + points, 10, canvas.height - 20);
}

// 텍스트 그리기
function drawText(message, x, y) {
    ctx.fillText(message, x, y);
}

// 영웅 사망 판정
function isHeroDead() {
    return hero.life <= 0;
}

// 적 전체 사망 판정
function isEnemiesDead() {
    // gameObjects 배열에 "Enemy" 타입이면서 dead 가 거짓인 객체만 필터링하고
    const enemies = gameObjects.filter((go) => go.type === "Enemy" && !go.dead);
    // 필터링한 배열의 길이로 전체 사망 판정을 구현
    return enemies.length === 0;
}

// 화면 중앙에 메시지를 띄우는 메서드.
function displayMessage(message, color = "red") {
    ctx.font = "30px Arial";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

// 게임 종료 시 호출되는 메서드. 위의 window.onload 에서 호출되고 있음
function endGame(win) {
    // 전역 변수 목록에 gameLoopId 가 있었고, window.onload에서 게임 초기화 직후에
    // 게임 작동용 타이머를 생성해서 이 변수에 넣었었음.
    // 게임이 종료되었으니 타이머 제거
    clearInterval(gameLoopId);
    // 게임 재시작 용
    eventEmitter.on(Messages.KEY_EVENT_ENTER, () => {
        stageIdx = 0;
        resetGame();
    });
    // 게임 화면이 겹칠 수 있으니, 200ms 지연 후에 게임 종료 화면을 그림
    setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (win) {
            // 승리했다면 글씨 색을 녹색으로 설정하고 승리문구 출력
            displayMessage(
                "Victory!!! Pew Pew... - Press [Enter] to start a new game Captain Pew Pew",
                "green"
            );
        } else {
            // 아니면 패배문구 출력. 이 메서드의 정의에서 적색이 기본값으로 설정되어 있음
            displayMessage(
                "You died !!! Press [Enter] to start a new game Captain Pew Pew"
            );
        }
    }, 200)
}

function nextStage() {
    // 스테이지가 끝까지 도달했으면 게임 승리 이벤트 발행
    if (enemySpawnFunctions.length <= ++stageIdx) {
        endGame(true);
    } else {    // 아니면 다음 스테이지 준비 화면
        clearInterval(gameLoopId);
        setTimeout(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            displayMessage(
                "Stage Clear! Press [Enter] to start next stage",
                "green"
            );
            eventEmitter.on(Messages.KEY_EVENT_ENTER, () => {
                resetGame(stageIdx);
            });
        }, 200);
    }
}

// 게임 리셋 메서드
function resetGame(enemyFunc = 0) {
    // 이미 작동중인 게임 작동용 타이머가 있으면
    if (gameLoopId) {
        clearInterval(gameLoopId); // 게임 루프 중지해서 중복 실행 방지
        eventEmitter.clear(); // 모든 이벤트 리스너 제거, 이전 게임 세션과 충돌 방지
        gameObjects.filter((o) => o.type === "Buddy" || o.type == "Enemy").forEach((o) => clearInterval(o.id));
        initGame(enemyFunc); // 게임 초기화
        gameLoopId = setInterval(standardGameloop, 100);
    }
}

function standardGameloop() {
    // 화면 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // 게임 객체 그리기
    drawGameObjects(ctx);
    // 게임 객체 업데이트. 이 메서드 내에서 충돌 감지가 작동하고 있음.
    updateGameObjects();
    drawPoints();
    drawLife();

    if (isEnemiesDead()) eventEmitter.emit(Messages.GAME_STAGE_END);
}

// 적 생성 메서드. 2차원 0 or 1 배열을 받아서 1인 자리에 적 배치, 적 수에 따라 크기 스케일링
function placeEnemies(matrix) {
    let longest = matrix.reduce((acc, cur) => {
        return acc < cur.length ? cur.length : acc;
    }, 0)
    let scaler = 1;
    if (longest > 10) {
        scaler = 10 / longest;
    }

    let itemH = enemyImg.height * scaler;
    let itemW = enemyImg.width * scaler;

    // 제일 위쪽 줄부터
    for (let y = 0; y < matrix.length; y++) {
        const line = matrix[y];
        const startX = (canvas.width - itemW * line.length) / 2
        // 왼쪽부터 오른쪽까지
        for (let x = 0; x < line.length; x++) {
            if (line[x] === 1) {// 적 생성, 이미지 등록, 배열에 담기
                const enemy = new Enemy(startX + x * itemW, y * itemH);
                enemy.height = itemH;
                enemy.width = itemW;
                enemy.img = enemyImg;
                gameObjects.push(enemy);
            }
        }
    }
}

// 적 생성 메서드
function createEnemies() {
    const matrix = [
        [1, 1, 1, 1, 1,],
        [1, 1, 1, 1,],
        [1, 1, 1,],
        [1, 1,],
        [1,],
    ]
    placeEnemies(matrix);
}

function createEnemies2() {
    const matrix = [
        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 0, 1, 1, 0,],
        [0, 1, 1, 0, 0, 0, 0, 1, 0,],
        [0, 0, 1, 0, 0, 1, 1, 0, 0, 0,],
        [0, 0, 0, 0, 0, 1, 0, 0, 0,],
    ]
    placeEnemies(matrix);
}

function createEnemies3() {
    const matrix = [
        [1, 1, 1, 1, 1,],
        [1, 1, 1, 1, 1,],
        [1, 1, 1, 1, 1,],
        [1, 1, 1, 1, 1,],
        [1, 1, 1, 1, 1,],
    ]
    placeEnemies(matrix);
}

function createEnemies4() {
    const matrix = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 0, 1, 1, 1, 1, 0, 1, 0],
        [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
    ]
    placeEnemies(matrix);
}

function createEnemies5() {
    const matrix = [
        [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0],
    ]
    placeEnemies(matrix);

    const boss = new Boss((canvas.width - bossImg.width) / 2, 0);
    boss.img = bossImg;
    gameObjects.push(boss);
}