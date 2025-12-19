const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let keys = {};
let bullets = [];
let enemyBullets = [];
let enemies = [];
let explosions = [];
let boss = null;

let gameOver = false;
let invincible = false;

let player = {
  x: 280,
  y: 620,
  w: 40,
  h: 40,
  lives: 3,
  speed: 5
};

function startGame() {
  document.getElementById("story").style.display = "none";
  canvas.style.display = "block";
  spawnEnemies();
  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

function spawnEnemies() {
  enemies = [];
  for (let i = 0; i < 20; i++) {
    enemies.push({
      x: 50 + (i % 5) * 100,
      y: 50 + Math.floor(i / 5) * 60,
      w: 30,
      h: 30,
      alive: true,
      shootTimer: Math.random() * 120
    });
  }
}

function spawnBoss() {
  boss = {
    x: 200,
    y: 50,
    w: 200,
    h: 80,
    lives: 10,
    dir: 2,
    shootTimer: 0
  };
}

function shoot() {
  bullets.push({ x: player.x + 18, y: player.y, r: 5 });
}

let shootCooldown = 0;

function createExplosion(x, y, size) {
  explosions.push({ x, y, size, life: 20 });
}

function update() {
  if (gameOver) return;

  // Player movement
  if (keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["ArrowRight"]) player.x += player.speed;
  if (keys["ArrowUp"]) player.y -= player.speed;
  if (keys["ArrowDown"]) player.y += player.speed;

  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));

  // Shooting
  if (keys["Space"] && shootCooldown <= 0) {
    shoot();
    shootCooldown = 15;
  }
  shootCooldown--;

  bullets.forEach(b => b.y -= 8);
  enemyBullets.forEach(b => b.y += b.speed);

  // Enemy shooting
  enemies.forEach(e => {
    e.shootTimer--;
    if (e.shootTimer <= 0 && e.alive) {
      enemyBullets.push({
        x: e.x + e.w / 2,
        y: e.y + e.h,
        speed: 4
      });
      e.shootTimer = 120 + Math.random() * 120;
    }
  });

  // Boss logic
  if (boss) {
    boss.x += boss.dir;
    if (boss.x <= 0 || boss.x + boss.w >= canvas.width) boss.dir *= -1;

    boss.shootTimer--;
    if (boss.shootTimer <= 0) {
      enemyBullets.push(
        { x: boss.x + 40, y: boss.y + boss.h, speed: 5 },
        { x: boss.x + boss.w / 2, y: boss.y + boss.h, speed: 6 },
        { x: boss.x + boss.w - 40, y: boss.y + boss.h, speed: 5 }
      );
      boss.shootTimer = 50;
    }
  }

  // Bullet collisions (enemies)
  bullets.forEach(b => {
    enemies.forEach(e => {
      if (e.alive &&
          b.x > e.x && b.x < e.x + e.w &&
          b.y > e.y && b.y < e.y + e.h) {
        e.alive = false;
        createExplosion(e.x + 15, e.y + 15, 15);
        b.y = -100;
      }
    });

    if (boss &&
        b.x > boss.x && b.x < boss.x + boss.w &&
        b.y > boss.y && b.y < boss.y + boss.h) {
      boss.lives--;
      createExplosion(b.x, b.y, 10);
      b.y = -100;

      if (boss.lives <= 0) {
        createExplosion(boss.x + boss.w / 2, boss.y + boss.h / 2, 60);
        alert("Boss destroyed! Ship repaired.");
        location.reload();
      }
    }
  });

  // Player hit
  enemyBullets.forEach(b => {
    if (!invincible &&
        b.x > player.x && b.x < player.x + player.w &&
        b.y > player.y && b.y < player.y + player.h) {
      player.lives--;
      invincible = true;
      createExplosion(player.x + 20, player.y + 20, 30);
      setTimeout(() => invincible = false, 1500);
      b.y = canvas.height + 100;

      if (player.lives <= 0) {
        gameOver = true;
        setTimeout(() => alert("GAME OVER"), 500);
      }
    }
  });

  enemies = enemies.filter(e => e.alive);

  if (enemies.length === 0 && !boss) spawnBoss();

  explosions.forEach(ex => ex.life--);
  explosions = explosions.filter(ex => ex.life > 0);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player
  if (!invincible || Math.floor(Date.now() / 100) % 2 === 0) {
    ctx.fillStyle = "cyan";
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }

  // Player bullets
  ctx.fillStyle = "yellow";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 10));

  // Enemy bullets
  ctx.fillStyle = "orange";
  enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 10));

  // Enemies
  ctx.fillStyle = "red";
  enemies.forEach(e => ctx.fillRect(e.x, e.y, e.w, e.h));

  // Boss
  if (boss) {
    ctx.fillStyle = "purple";
    ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
    ctx.fillStyle = "white";
    ctx.fillText("Boss Lives: " + boss.lives, 10, 20);
  }

  // Explosions
  explosions.forEach(ex => {
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, ex.size * (ex.life / 20), 0, Math.PI * 2);
    ctx.fillStyle = "orange";
    ctx.fill();
  });

  ctx.fillStyle = "white";
  ctx.fillText("Lives: " + player.lives, 520, 20);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
