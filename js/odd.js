/* ========== GAME 3: JUNGLE LAUNCHER (ANGRY BIRDS STYLE) ========== */
var oddQuestions = [
  { question: 'Which one CANNOT smell?', options: [
    { emoji: '🌸', label: 'Flower', img: '../assets/flower-removebg-preview.png' },
    { emoji: '✏️', label: 'Pencil', img: '../assets/pencil-removebg-preview.png' },
    { emoji: '🍲', label: 'Soup', img: '../assets/soup-removebg-preview.png' }
  ], correctIdx: 1 },
  { question: 'Which one CANNOT taste?', options: [
    { emoji: '🍦', label: 'Ice Cream', img: '../assets/ice_cream-removebg-preview.png' },
    { emoji: '🍫', label: 'Chocolate', img: '../assets/chocolate-removebg-preview.png' },
    { emoji: '🤖', label: 'Robot', img: '../assets/robot-removebg-preview.png' }
  ], correctIdx: 2 },
  { question: 'Which one CANNOT hear?', options: [
    { emoji: '🍎', label: 'Apple', img: '../assets/apple-removebg-preview.png' },
    { emoji: '📢', label: 'Megaphone', img: '../assets/speaker-removebg-preview.png' },
    { emoji: '🔔', label: 'Bell', img: '../assets/bell-removebg-preview.png' }
  ], correctIdx: 0 }
];

var loadedImages = {};
function preloadOptionImages(callback) {
  var imgs = [];
  oddQuestions.forEach(function(q) {
    q.options.forEach(function(opt) {
      if (opt.img && !loadedImages[opt.img]) {
        imgs.push(opt.img);
      }
    });
  });
  if (imgs.length === 0) { callback(); return; }
  var loaded = 0;
  imgs.forEach(function(src) {
    var img = new Image();
    img.onload = img.onerror = function() {
      loadedImages[src] = img;
      loaded++;
      if (loaded >= imgs.length) callback();
    };
    img.src = src;
  });
}

var GRAVITY = 0.25;
var LAUNCH_POWER = 0.35;
var MAX_PULL = 120;
var MIN_PULL = 25;
var TRAJECTORY_DOTS = 30;
var ODD_TIMER = 120;

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
  animFrame: null,
  timeLeft: ODD_TIMER,
  timerId: null,
  demo: false,
  demoPhase: 0,
  demoHit: false
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
    preloadOptionImages(function() {
      loadOddLevel();
      updateOddProgress();
      oddDemo();
      renderOddCanvas();
    });
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

function startOddTimer() {
  if (oddState.timerId) clearInterval(oddState.timerId);
  oddState.timeLeft = ODD_TIMER;
  updateOddTimerUI();
  oddState.timerId = setInterval(function() {
    oddState.timeLeft--;
    updateOddTimerUI();
    if (oddState.timeLeft <= 0) {
      clearInterval(oddState.timerId);
      oddState.timerId = null;
      oddTimeout();
    }
  }, 1000);
}

function updateOddTimerUI() {
  var el = document.getElementById('oddTimer');
  if (!el) return;
  var m = Math.floor(Math.max(0, oddState.timeLeft) / 60);
  var s = Math.max(0, oddState.timeLeft) % 60;
  el.textContent = '⏰ ' + m + ':' + (s < 10 ? '0' + s : s);
  el.classList.toggle('low', oddState.timeLeft <= 30);
}

function oddTimeout() {
  oddState.launched = false;
  speak("Time's Up! Play Again?");
  showResult('⏰', "Time's Up! Play Again?", G.score, G.totalXP, G.bestCombo, true);
}

function oddDemo() {
  oddState.demo = true;
  oddState.demoPhase = 0;
  oddState.demoHit = false;
  oddState._demoFinishScheduled = false;

  var tgt = getOddDemoTarget();
  var slX = oddState.slingshot.x;
  var slY = oddState.slingshot.y - 30;
  var t = 55;
  var denom = 1 - LAUNCH_POWER * t;
  oddState.demoPullX = (tgt.x - slX * LAUNCH_POWER * t) / denom;
  oddState.demoPullY = (tgt.y - slY * LAUNCH_POWER * t - 0.5 * GRAVITY * t * t) / denom;

  var el = document.getElementById('oddInstruction');
  if (el) el.textContent = '👀 Watch! Drag the bird back, then let go!';
}

function oddDemoFinish() {
  if (!oddState.demo) return;
  oddState._demoFinishScheduled = false;
  oddState.demo = false;
  oddState.demoPhase = 0;
  oddState.demoHit = false;
  resetOddState();
  loadOddLevel();
  updateOddProgress();
  startOddTimer();
  var el = document.getElementById('oddInstruction');
  if (el) el.textContent = 'Drag the bird back to aim, then release to launch!';
}

function getOddDemoTarget() {
  for (var i = 0; i < oddState.targets.length; i++) {
    if (oddState.targets[i].isOdd) return oddState.targets[i];
  }
  return oddState.targets[0] || null;
}

function oddDemoStep() {
  var bird = oddState.bird;
  if (!bird) return;
  var origin = { x: oddState.slingshot.x, y: oddState.slingshot.y - 30 };
  var PULL = 110;
  var HOLD = 40;
  var RELEASE = PULL + HOLD;

  if (!oddState.launched && oddState.demoPhase < PULL) {
    var e = oddState.demoPhase / PULL;
    e = e * e * (3 - 2 * e);
    bird.x = origin.x + (oddState.demoPullX - origin.x) * e;
    bird.y = origin.y + (oddState.demoPullY - origin.y) * e;
    bird.active = true;
    bird.vx = 0; bird.vy = 0;
    oddState.dragging = true;
    oddState.demoPhase++;
  } else if (!oddState.launched && oddState.demoPhase < RELEASE) {
    bird.x = oddState.demoPullX;
    bird.y = oddState.demoPullY;
    bird.active = true;
    bird.vx = 0; bird.vy = 0;
    oddState.dragging = true;
    oddState.demoPhase++;
  } else if (!oddState.launched) {
    var slX = oddState.slingshot.x;
    var slY = oddState.slingshot.y - 30;
    bird.vx = (slX - bird.x) * LAUNCH_POWER;
    bird.vy = (slY - bird.y) * LAUNCH_POWER;
    oddState.launched = true;
    oddState.dragging = false;
    oddState.demoPhase++;
  } else if (oddState.demoHit) {
    for (var pi = 0; pi < oddState.particles.length; pi++) {
      var pp = oddState.particles[pi];
      pp.x += pp.vx;
      pp.y += pp.vy;
      pp.life -= 0.02;
      pp.size *= 0.98;
    }
    oddState.particles = oddState.particles.filter(function(p) { return p.life > 0; });
  }
}

function showOddPopup(text, type) {
  var el = document.getElementById('oddResultPopup');
  if (!el) return;
  el.textContent = text;
  el.className = 'odd-result-popup ' + (type || '') + ' show';
  clearTimeout(el._timer);
  var dur = type === 'wrong' ? 1200 : 2000;
  el._timer = setTimeout(function() { el.className = 'odd-result-popup'; }, dur);
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
    radius: 24,
    vx: 0, vy: 0,
    active: true
  };

  oddState.targets = [];
  var cw = Math.max(canvas.width, 600);
  var ch = canvas.height;
  var count = q.options.length;
  var targetX = cw * 0.78;
  var labelFootprint = 82;
  var desiredSpacing = 145;
  var spacing = Math.min(desiredSpacing, (ch - 60 - labelFootprint) / Math.max(count - 1, 1));
  spacing = Math.max(135, spacing);
  var topY = 60;

  q.options.forEach(function(opt, i) {
    oddState.targets.push({
      x: targetX,
      y: topY + spacing * i,
      radius: 48,
      emoji: opt.emoji,
      label: opt.label,
      img: opt.img || null,
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
    if (oddState.demo) return;
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
    if (oddState.demo) return;
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
    if (oddState.demo) return;
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
  var target = oddState.hoveredTarget;

  var dx = slX - bird.x;
  var dy = slY - bird.y;
  var pullDist = Math.sqrt(dx * dx + dy * dy);

  if (pullDist < MIN_PULL) {
    bird.x = slX;
    bird.y = slY;
    bird.vx = 0;
    bird.vy = 0;
    document.getElementById('oddInstruction').textContent = 'Pull the bird back more, then release!';
    return;
  }

  if (target) {
    var targetVelocity = getTargetLaunchVelocity(bird, target, pullDist);
    bird.vx = targetVelocity.vx;
    bird.vy = targetVelocity.vy;
  } else {
    bird.vx = dx * LAUNCH_POWER;
    bird.vy = dy * LAUNCH_POWER;
  }
  oddState.launched = true;
  playSound('launch');
  oddState.targetedItem = oddState.hoveredTarget;
  oddState.hoveredTarget = null;

  document.getElementById('oddInstruction').textContent = 'Watch the bird fly!';
}

function getTargetLaunchVelocity(bird, target, pullDist) {
  var flightTime = 34;
  var targetDX = target.x - bird.x;
  var targetDY = target.y - bird.y;
  return {
    vx: targetDX / flightTime,
    vy: (targetDY - 0.5 * GRAVITY * flightTime * flightTime) / flightTime
  };
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

  if (oddState.demo) oddDemoStep();

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
}

function drawSlingshot(ctx) {
  var s = oddState.slingshot;

  ctx.fillStyle = '#5d4037';
  ctx.beginPath();
  ctx.moveTo(s.x - 14, s.y);
  ctx.lineTo(s.x + 14, s.y);
  ctx.lineTo(s.x + 7, s.y - 112);
  ctx.lineTo(s.x - 7, s.y - 112);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#8d6e63';
  ctx.beginPath();
  ctx.moveTo(s.x - 5, s.y - 7);
  ctx.lineTo(s.x + 5, s.y - 7);
  ctx.lineTo(s.x + 3, s.y - 106);
  ctx.lineTo(s.x - 3, s.y - 106);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#4a3428';
  ctx.beginPath();
  ctx.arc(s.x - 18, s.y - 106, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s.x + 18, s.y - 106, 11, 0, Math.PI * 2);
  ctx.fill();
}

function drawElasticBand(ctx) {
  var bird = oddState.bird;
  var s = oddState.slingshot;

  ctx.strokeStyle = '#8d6e63';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(s.x - 18, s.y - 106);
  ctx.lineTo(bird.x, bird.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s.x + 18, s.y - 106);
  ctx.lineTo(bird.x, bird.y);
  ctx.stroke();

  ctx.strokeStyle = '#a1887f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s.x - 18, s.y - 106);
  ctx.lineTo(bird.x, bird.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s.x + 18, s.y - 106);
  ctx.lineTo(bird.x, bird.y);
  ctx.stroke();
}

function getMarkedTrajectoryPoints(bird, target) {
  var dx = target.x - bird.x;
  var dy = target.y - bird.y;
  var lift = Math.max(150, Math.abs(dy) * 0.65);
  var c1 = { x: bird.x + dx * 0.28, y: bird.y - lift };
  var c2 = { x: bird.x + dx * 0.72, y: target.y - Math.max(24, Math.abs(dy) * 0.18) };
  var dense = [];
  for (var i = 0; i <= 120; i++) {
    var t = i / 120;
    var inverse = 1 - t;
    dense.push({
      x: inverse * inverse * inverse * bird.x + 3 * inverse * inverse * t * c1.x + 3 * inverse * t * t * c2.x + t * t * t * target.x,
      y: inverse * inverse * inverse * bird.y + 3 * inverse * inverse * t * c1.y + 3 * inverse * t * t * c2.y + t * t * t * target.y
    });
  }
  var distances = [0];
  for (var j = 1; j < dense.length; j++) {
    var previous = dense[j - 1];
    var current = dense[j];
    var segmentX = current.x - previous.x;
    var segmentY = current.y - previous.y;
    distances[j] = distances[j - 1] + Math.sqrt(segmentX * segmentX + segmentY * segmentY);
  }
  var total = distances[distances.length - 1];
  var points = [];
  for (var pointIndex = 1; pointIndex <= TRAJECTORY_DOTS; pointIndex++) {
    var wanted = total * pointIndex / TRAJECTORY_DOTS;
    var segment = 1;
    while (segment < distances.length - 1 && distances[segment] < wanted) segment++;
    var range = distances[segment] - distances[segment - 1] || 1;
    var ratio = (wanted - distances[segment - 1]) / range;
    points.push({
      x: dense[segment - 1].x + (dense[segment].x - dense[segment - 1].x) * ratio,
      y: dense[segment - 1].y + (dense[segment].y - dense[segment - 1].y) * ratio
    });
  }
  return points;
}

function drawTrajectoryArc(ctx) {
  var bird = oddState.bird;
  var slX = oddState.slingshot.x;
  var slY = oddState.slingshot.y - 30;

  var launchVX = (slX - bird.x) * LAUNCH_POWER;
  var launchVY = (slY - bird.y) * LAUNCH_POWER;
  var target = oddState.hoveredTarget;
  var points = [];
  if (target) {
    var pullDX = slX - bird.x;
    var pullDY = slY - bird.y;
    var pullDist = Math.sqrt(pullDX * pullDX + pullDY * pullDY);
    var targetVelocity = getTargetLaunchVelocity(bird, target, pullDist);
    launchVX = targetVelocity.vx;
    launchVY = targetVelocity.vy;
  }

  var simX = bird.x;
  var simY = bird.y;
  var simVX = launchVX;
  var simVY = launchVY;

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
      if (Math.sqrt(tdx * tdx + tdy * tdy) < oddState.bird.radius + t.radius) {
        hitTarget = true;
        break;
      }
    }
    if (hitTarget) break;

    if (simY > oddState.canvas.height - 50 || simX > oddState.canvas.width + 20 || simX < -20) break;
  }

  if (points.length < 2) return;

  ctx.save();

  ctx.strokeStyle = 'rgba(255,255,100,0.4)';
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
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

  ctx.strokeStyle = 'rgba(255,220,50,0.7)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 6]);
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
    var alpha = 1 - (i / points.length) * 0.7;
    var size = 4.5 - (i / points.length) * 3;
    ctx.fillStyle = 'rgba(255,230,80,' + alpha + ')';
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, Math.max(size, 1.5), 0, Math.PI * 2);
    ctx.fill();

    if (i % 4 === 0) {
      ctx.fillStyle = 'rgba(255,255,200,' + (alpha * 0.5) + ')';
      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, Math.max(size + 3, 3), 0, Math.PI * 2);
      ctx.fill();
    }
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

    var imgSrc = t.img || null;
    var loadedImg = imgSrc ? loadedImages[imgSrc] : null;
    if (loadedImg && loadedImg.complete && loadedImg.naturalWidth > 0) {
      var maxDim = t.radius * 1.6;
      var iw = loadedImg.naturalWidth;
      var ih = loadedImg.naturalHeight;
      var scale = Math.min(maxDim / iw, maxDim / ih);
      var drawW = iw * scale;
      var drawH = ih * scale;
      ctx.drawImage(loadedImg, -drawW / 2, -drawH / 2 - 2, drawW, drawH);
    } else {
      ctx.font = '54px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.emoji, 0, -6);
    }

    ctx.fillStyle = 'rgba(10,26,15,0.7)';
    var tw = ctx.measureText(t.label).width;
    var boxW = tw + 16;
    var boxH = 26;
    var boxX = -boxW / 2;
    var boxY = t.radius + 8;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 4);
    ctx.fill();

    ctx.fillStyle = '#f5f5dc';
    ctx.font = 'bold 16px Fredoka, Arial';
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

        if (oddState.demo) {
          oddState.demoHit = true;
          if (!oddState._demoFinishScheduled) {
            oddState._demoFinishScheduled = true;
            setTimeout(oddDemoFinish, 1200);
          }
          return;
        }

        if (t.isOdd) {
          t.hit = true;
          addScore(20);
          playSound('correct');
          speak('Correct!');
          showOddPopup('🎯 Perfect Hit! +20', 'correct');
          document.getElementById('oddInstruction').textContent = '✅ You found the odd one out!';
          setTimeout(function() { nextOddLevel(); }, 1200);
        } else {
          wrongAnswer();
          playSound('wrong');
          speak('Try again');
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

  if (oddState.launched && !oddState.hitProcessed && !oddState.demo) {
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
    if (oddState.timerId) { clearInterval(oddState.timerId); oddState.timerId = null; }
    speak('Congratulations! Jungle Launcher Complete!');
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
