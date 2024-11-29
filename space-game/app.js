function loadTexture(path) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = path;
        img.onload = () => {
            resolve(img);
        };
    })
}

window.onload = async () => {
    const canvas = document.getElementById("myCanvas");
    const ctx = canvas.getContext("2d");
    const heroImg = await loadTexture("assets/player.png");
    const enemyImg = await loadTexture("assets/enemyShip.png");
    const pattern = ctx.createPattern(await loadTexture("assets/starBackground.png"), "repeat");

    ctx.fillStyle = pattern;

    ctx.fillRect(0, 0, canvas.clientWidth, canvas.height);

    let heroX = canvas.width / 2 - 45;
    let heroY = canvas.height - (canvas.height / 4);
    ctx.drawImage(heroImg, heroX, heroY);
    createEnemies2(ctx, canvas, enemyImg);
    createBuddy(ctx, heroImg, heroX, heroY);
};

function createBuddy(ctx, heroImg, heroX, heroY) {
    ctx.drawImage(heroImg, heroX - heroImg.width * 0.75, heroY + heroImg.height * 0.2, heroImg.width / 2, heroImg.height / 2);
    ctx.drawImage(heroImg, heroX + heroImg.width * 1.25, heroY + heroImg.height * 0.2, heroImg.width / 2, heroImg.height / 2);
}

function createEnemies(ctx, canvas, enemyImg) {
    const MONSTER_TOTAL = 5;
    const MONSTER_WIDTH = MONSTER_TOTAL * enemyImg.width;
    const START_X = (canvas.width - MONSTER_WIDTH) / 2;
    const STOP_X = START_X + MONSTER_WIDTH;

    for (let x = START_X; x < STOP_X; x += enemyImg.width) {
        for (let y = 0; y < enemyImg.height * 5; y += enemyImg.height) {
            ctx.drawImage(enemyImg, x, y);
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