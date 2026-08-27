/* ========== GAME 3: JUNGLE LAUNCHER (ANGRY BIRDS STYLE) ========== */
var oddQuestions = [
  { question: 'Which one CANNOT smell?', options: [
    { emoji: '🌸', label: 'Flower' },
    { emoji: '✏️', label: 'Pencil' },
    { emoji: '🍲', label: 'Soup' }
  ], correctIdx: 1 },
  { question: 'Which one CANNOT taste?', options: [
    { emoji: '🍦', label: 'Ice Cream' },
    { emoji: '🍫', label: 'Chocolate' },
    { emoji: '🤖', label: 'Robot' }
  ], correctIdx: 2 },
  { question: 'Which one CANNOT hear?', options: [
    { emoji: '🍎', label: 'Apple' },
    { emoji: '📢', label: 'Megaphone' },
    { emoji: '🔔', label: 'Bell' }
  ], correctIdx: 0 },
  { question: 'Which one is NOT for seeing?', options: [
    { emoji: '👁️', label: 'Eyes' },
    { emoji: '👃', label: 'Nose' },
    { emoji: '🌳', label: 'Tree' }
  ], correctIdx: 1 },
  { question: 'Which one you CANNOT feel?', options: [
    { emoji: '🪨', label: 'Rock' },
    { emoji: '🔥', label: 'Fire' },
    { emoji: '🎵', label: 'Music' }
  ], correctIdx: 2 },
  { question: 'Which one is NOT soft?', options: [
    { emoji: '🧸', label: 'Teddy Bear' },
    { emoji: '🪨', label: 'Stone' },
    { emoji: '☁️', label: 'Cloud' }
  ], correctIdx: 1 }
];

var GRAVITY = 0.25;
var LAUNCH_POWER = 0.35;
var MAX_PULL = 120;
var TRAJECTORY_DOTS = 30;

var oddState = {
  current: 0,
  bird: null,
  targets: [],
  slingshot: { x: 220, y: 420 },
  dragging: false,
  dragStart: { x: 0, y: 0 },
  hoveredTarget: null,
  targetedItem: null,
  launched: false,
  hitProcessed: false,
  answered: false,
  particles: [],
  canvas: null,
  ctx: null,
  animFrame: null
};

function initOddGame() {
  oddState.current = 0;
  resetOddState();

  var canvas = document.getElementById('oddCanvas');
  var stage = document.getElementById('oddStage');
  if (!canvas || !stage) return;

  function sizeCanvas() {
    var w = stage.clientWidth;
    var h = stage.clientHeight;
    if (w > 50 && h > 50) {
      canvas.width = w;
      canvas.height = h;
      return true;
    }
    return false;
  }

  function startGame() {
    if (!sizeCanvas()) { setTimeout(startGame, 100); return; }
    oddState.canvas = canvas;
    oddState.ctx = canvas.getContext('2d');
    oddState.slingshot.x = 220;
    oddState.slingshot.y = canvas.height - 80;
    setupOddEvents();
    loadOddLevel();
    updateOddProgress();
    renderOddCanvas();
  }

  startGame();
}

function resetOddState() {
  oddState.bird = null;
  oddState.targets = [];
  oddState.dragging = false;
  oddState.dragStart = { x: 0, y: 0 };
  oddState.hoveredTarget = null;
  oddState.targetedItem = null;
  oddState.launched = false;
  oddState.hitProcessed = false;
  oddState.answered = false;
  oddState.particles = [];
}

function showOddPopup(text, type) {
  var el = document.getElementById('oddResultPopup');
  if (!el) return;
  el.textContent = text;
  el.className = 'odd-result-popup ' + (type || '') + ' show';
  clearTimeout(el._timer);
  el._timer = setTimeout(function() { el.className = 'odd-result-popup'; }, 1500);
}

function loadOddLevel() {
  var q = oddQuestions[oddState.current];
  var canvas = oddState.canvas;
  if (!canvas || !oddState.ctx) return;

  oddState.launched = false;
  oddState.hitProcessed = false;
  oddState.answered = false;
  oddState.dragging = false;
  oddState.targetedItem = null;
  oddState.hoveredTarget = null;
  oddState.particles = [];

  document.getElementById('oddQuestion').innerHTML = '<h3>🎯 ' + q.question + '</h3>';
  document.getElementById('oddCount').textContent = 'Q ' + (oddState.current + 1) + '/' + oddQuestions.length;

  oddState.bird = {
    x: oddState.slingshot.x,
    y: oddState.slingshot.y - 30,
    radius: 18,
    vx: 0, vy: 0,
    active: true
  };

  oddState.targets = [];
  var cw = Math.max(canvas.width, 600);
  var ch = canvas.height;
  var count = q.options.length;
  var targetX = cw * 0.78;
  var topY = ch * 0.05;
  var bottomY = ch * 0.85;
  var spacing = (bottomY - topY) / (count + 1);

  q.options.forEach(function(opt, i) {
    oddState.targets.push({
      x: targetX,
      y: topY + spacing * (i + 1),
      radius: 34,
      emoji: opt.emoji,
      label: opt.label,
      isOdd: i === q.correctIdx,
      hit: false
    });
  });

  document.getElementById('oddInstruction').textContent = 'Drag the bird back to aim, then release to launch!';

  if (oddState.animFrame) cancelAnimationFrame(oddState.animFrame);
  renderOddCanvas();
}

function setupOddEvents() {
  var canvas = oddState.canvas;

  canvas.onmousedown = canvas.ontouchstart = function(e) {
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var pos = getOddPos(e, rect);
    var bird = oddState.bird;
    if (!oddState.launched && bird && bird.active) {
      var dx = pos.x - bird.x;
      var dy = pos.y - bird.y;
      if (Math.sqrt(dx * dx + dy * dy) < 50) {
        oddState.dragging = true;
        oddState.dragStart = { x: bird.x, y: bird.y };
      }
    }
  };

  canvas.onmousemove = canvas.ontouchmove = function(e) {
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var pos = getOddPos(e, rect);

    oddState.hoveredTarget = null;
    if (!oddState.launched && !oddState.dragging) {
      for (var i = 0; i < oddState.targets.length; i++) {
        var t = oddState.targets[i];
        if (t.hit) continue;
        var dx = pos.x - t.x;
        var dy = pos.y - t.y;
        if (Math.sqrt(dx * dx + dy * dy) < t.radius + 15) {
          oddState.hoveredTarget = t;
          break;
        }
      }
    }

    if (!oddState.dragging) return;

    oddState.hoveredTarget = null;
    for (var i = 0; i < oddState.targets.length; i++) {
      var t = oddState.targets[i];
      if (t.hit) continue;
      var tdx = pos.x - t.x;
      var tdy = pos.y - t.y;
      if (Math.sqrt(tdx * tdx + tdy * tdy) < t.radius + 15) {
        oddState.hoveredTarget = t;
        break;
      }
    }

    var slX = oddState.slingshot.x;
    var slY = oddState.slingshot.y - 30;
    var dx = pos.x - slX;
    var dy = pos.y - slY;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > MAX_PULL) {
      dx = dx / dist * MAX_PULL;
      dy = dy / dist * MAX_PULL;
    }

    oddState.bird.x = slX + dx;
    oddState.bird.y = slY + dy;
  };

  canvas.onmouseup = canvas.ontouchend = function(e) {
    if (!oddState.dragging) return;
    oddState.dragging = false;
    launchBird();
  };

  canvas.onmouseleave = function() {
    oddState.hoveredTarget = null;
  };
}

function getOddPos(e, rect) {
  var touch = e.touches ? e.touches[0] : e;
  return {
    x: (touch.clientX - rect.left) * (oddState.canvas.width / rect.width),
    y: (touch.clientY - rect.top) * (oddState.canvas.height / rect.height)
  };
}

function launchBird() {
  var bird = oddState.bird;
  var slX = oddState.slingshot.x;
  var slY = oddState.slingshot.y - 30;

  var dx = slX - bird.x;
  var dy = slY - bird.y;

  bird.vx = dx * LAUNCH_POWER;
  bird.vy = dy * LAUNCH_POWER;
  oddState.launched = true;
  playSound('launch');
  oddState.targetedItem = oddState.hoveredTarget;
  oddState.hoveredTarget = null;

  document.getElementById('oddInstruction').textContent = 'Watch the bird fly!';
}

function renderOddCanvas() {
  var ctx = oddState.ctx;
  var canvas = oddState.canvas;

  if (!ctx || !canvas || canvas.width < 50 || canvas.height < 50) {
    oddState.animFrame = requestAnimationFrame(renderOddCanvas);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground(ctx, canvas);
  drawSlingshot(ctx);

  if (oddState.dragging && oddState.bird) {
    drawElasticBand(ctx);
    drawTrajectoryArc(ctx);
  }

  drawTargets(ctx);
  drawBird(ctx);
  drawParticles(ctx);
  updatePhysics();

  oddState.animFrame = requestAnimationFrame(renderOddCanvas);
}

function drawBackground(ctx, canvas) {
  var groundGrad = ctx.createLinearGradient(0, canvas.height - 60, 0, canvas.height);
  groundGrad.addColorStop(0, '#5d4037');
  groundGrad.addColorStop(1, '#3e2723');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(0, canvas.height - 54, canvas.width, 8);

  ctx.strokeStyle = '#27ae60';
  ctx.lineWidth = 2;
  for (var i = 0; i < canvas.width; i += 25) {
    ctx.beginPath();
    ctx.moveTo(i, canvas.height - 54);
    ctx.lineTo(i + 4, canvas.height - 70);
    ctx.lineTo(i + 8, canvas.height - 54);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i + 12, canvas.height - 54);
    ctx.lineTo(i + 15, canvas.height - 65);
    ctx.lineTo(i + 18, canvas.height - 54);
    ctx.stroke();
  }
}

function drawSlingshot(ctx) {
  var s = oddState.slingshot;

  ctx.fillStyle = '#5d4037';
  ctx.beginPath();
  ctx.moveTo(s.x - 10, s.y);
  ctx.lineTo(s.x + 10, s.y);
  ctx.lineTo(s.x + 5, s.y - 65);
  ctx.lineTo(s.x - 5, s.y - 65);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#8d6e63';
  ctx.beginPath();
  ctx.moveTo(s.x - 3, s.y - 5);
  ctx.lineTo(s.x + 3, s.y - 5);
  ctx.lineTo(s.x + 2, s.y - 60);
  ctx.lineTo(s.x - 2, s.y - 60);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#4a3428';
  ctx.beginPath();
  ctx.arc(s.x - 12, s.y - 60, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s.x + 12, s.y - 60, 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawElasticBand(ctx) {
  var bird = oddState.bird;
  var s = oddState.slingshot;

  ctx.strokeStyle = '#8d6e63';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(s.x - 12, s.y - 60);
  ctx.lineTo(bird.x, bird.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s.x + 12, s.y - 60);
  ctx.lineTo(bird.x, bird.y);
  ctx.stroke();

  ctx.strokeStyle = '#a1887f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s.x - 12, s.y - 60);
  ctx.lineTo(bird.x, bird.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s.x + 12, s.y - 60);
  ctx.lineTo(bird.x, bird.y);
  ctx.stroke();
}

function drawTrajectoryArc(ctx) {
  var bird = oddState.bird;
  var slX = oddState.slingshot.x;
  var slY = oddState.slingshot.y - 30;

  var launchVX = (slX - bird.x) * LAUNCH_POWER;
  var launchVY = (slY - bird.y) * LAUNCH_POWER;

  var simX = bird.x;
  var simY = bird.y;
  var simVX = launchVX;
  var simVY = launchVY;

  var points = [];
  for (var i = 0; i < TRAJECTORY_DOTS; i++) {
    simX += simVX;
    simY += simVY;
    simVY += GRAVITY;
    points.push({ x: simX, y: simY });

    var hitTarget = false;
    for (var j = 0; j < oddState.targets.length; j++) {
      var t = oddState.targets[j];
      if (t.hit) continue;
      var tdx = simX - t.x;
      var tdy = simY - t.y;
      if (Math.sqrt(tdx * tdx + tdy * tdy) < 18 + t.radius) {
        hitTarget = true;
        break;
      }
    }
    if (hitTarget) break;

    if (simY > oddState.canvas.height - 50 || simX > oddState.canvas.width + 20 || simX < -20) break;
  }

  if (points.length < 2) return;

  ctx.save();
  ctx.setLineDash([6, 4]);

  ctx.strokeStyle = 'rgba(255,255,100,0.6)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(bird.x, bird.y);

  for (var i = 0; i < points.length; i++) {
    if (i < points.length - 1) {
      var midX = (points[i].x + points[i + 1].x) / 2;
      var midY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    } else {
      ctx.lineTo(points[i].x, points[i].y);
    }
  }
  ctx.stroke();

  ctx.setLineDash([]);

  for (var i = 0; i < points.length; i++) {
    var alpha = 1 - (i / points.length) * 0.6;
    var size = 5 - (i / points.length) * 2.5;
    ctx.fillStyle = 'rgba(255,255,100,' + alpha + ')';
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, Math.max(size, 2), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawBird(ctx) {
  var bird = oddState.bird;
  if (!bird || !bird.active) return;

  ctx.save();
  ctx.translate(bird.x, bird.y);

  ctx.fillStyle = '#f1c40f';
  ctx.beginPath();
  ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#d4ac0d';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-5, -3, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(5, -3, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-3, -3, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(7, -3, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#27ae60';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-10, -10);
  ctx.lineTo(-3, -7);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(10, -10);
  ctx.lineTo(3, -7);
  ctx.stroke();

  ctx.fillStyle = '#e67e22';
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(-4, 8);
  ctx.lineTo(4, 8);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawTargets(ctx) {
  oddState.targets.forEach(function(t) {
    if (t.hit) return;

    ctx.save();
    ctx.translate(t.x, t.y);

    ctx.fillStyle = 'rgba(10,26,15,0.85)';
    ctx.beginPath();
    ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '42px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.emoji, 0, -6);

    ctx.fillStyle = 'rgba(10,26,15,0.7)';
    var tw = ctx.measureText(t.label).width;
    var boxW = tw + 16;
    var boxH = 18;
    var boxX = -boxW / 2;
    var boxY = t.radius - 22;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 4);
    ctx.fill();

    ctx.fillStyle = '#f5f5dc';
    ctx.font = 'bold 11px Fredoka, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.label, 0, boxY + boxH / 2);

    ctx.restore();
  });
}

function drawParticles(ctx) {
  oddState.particles.forEach(function(p) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function updatePhysics() {
  var bird = oddState.bird;
  if (!bird || !oddState.launched) return;

  bird.vy += GRAVITY;
  bird.x += bird.vx;
  bird.y += bird.vy;

  if (bird.y > oddState.canvas.height - 50 - bird.radius) {
    bird.y = oddState.canvas.height - 50 - bird.radius;
    bird.vy *= -0.5;
    bird.vx *= 0.8;
    if (Math.abs(bird.vy) < 1) bird.vy = 0;
  }

  if (bird.x < bird.radius || bird.x > oddState.canvas.width - bird.radius) {
    bird.vx *= -0.8;
    bird.x = Math.max(bird.radius, Math.min(oddState.canvas.width - bird.radius, bird.x));
  }

  if (!oddState.hitProcessed) {
    for (var i = 0; i < oddState.targets.length; i++) {
      var t = oddState.targets[i];
      if (t.hit) continue;
      var dx = bird.x - t.x;
      var dy = bird.y - t.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < bird.radius + t.radius) {
        oddState.hitProcessed = true;
        oddState.answered = true;

        bird.vx = 0;
        bird.vy = 0;
        bird.active = false;

        createExplosion(t.x, t.y);

        if (t.isOdd) {
          t.hit = true;
          addScore(20);
          playSound('correct');
          showOddPopup('🎯 Perfect Hit! +20', 'correct');
          document.getElementById('oddInstruction').textContent = '✅ You found the odd one out!';
          setTimeout(function() { nextOddLevel(); }, 1200);
        } else {
          wrongAnswer();
          playSound('wrong');
          showOddPopup('❌ Wrong! Try again!', 'wrong');
          document.getElementById('oddInstruction').textContent = 'That was part of the group! Try again!';
          setTimeout(function() { resetBird(); }, 800);
        }
        return;
      }
    }
  }

  oddState.particles.forEach(function(p) {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;
    p.size *= 0.98;
  });
  oddState.particles = oddState.particles.filter(function(p) { return p.life > 0; });

  if (oddState.launched && !oddState.hitProcessed) {
    var offScreen = bird.x > oddState.canvas.width + 100 || bird.y > oddState.canvas.height + 100 || bird.x < -100 || bird.y < -200;
    var stopped = Math.abs(bird.vx) < 0.3 && Math.abs(bird.vy) < 0.3 && bird.y > oddState.canvas.height - 100;
    if (offScreen || stopped) {
      oddState.hitProcessed = true;
      document.getElementById('oddInstruction').textContent = 'Bird flew away! Try again!';
      setTimeout(function() { resetBird(); }, 500);
    }
  }
}

function resetBird() {
  var bird = oddState.bird;
  if (!bird) return;
  bird.x = oddState.slingshot.x;
  bird.y = oddState.slingshot.y - 30;
  bird.vx = 0;
  bird.vy = 0;
  bird.active = true;
  oddState.launched = false;
  oddState.answered = false;
  oddState.hitProcessed = false;
  oddState.targetedItem = null;
  oddState.hoveredTarget = null;
  oddState.dragging = false;
  document.getElementById('oddInstruction').textContent = 'Drag the bird back to aim again!';
}

function createExplosion(x, y) {
  var colors = ['#2ecc71', '#f1c40f', '#e67e22', '#1abc9c', '#fff'];
  for (var i = 0; i < 25; i++) {
    oddState.particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12 - 4,
      size: Math.random() * 8 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1
    });
  }
}

function nextOddLevel() {
  if (oddState.current >= oddQuestions.length - 1) {
    showResult('🎯', 'Jungle Launcher Complete!', G.score, G.totalXP, G.bestCombo);
  } else {
    oddState.current++;
    loadOddLevel();
    updateOddProgress();
  }
}

function updateOddProgress() {
  var row = document.getElementById('oddProgress');
  row.innerHTML = '';
  for (var i = 0; i < oddQuestions.length; i++) {
    var dot = document.createElement('div');
    dot.className = 'odd-dot';
    if (i < oddState.current) dot.classList.add('done');
    else if (i === oddState.current) dot.classList.add('current');
    row.appendChild(dot);
  }
}

initOddGame();
