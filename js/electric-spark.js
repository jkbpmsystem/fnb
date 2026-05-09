/**
 * electric-spark.js
 * Animasi electric static / spark untuk background login page
 *
 * Cara guna:
 *   1. Letak <canvas id="spark-canvas"> dalam body
 *   2. Load script ini: <script src="js/electric-spark.js"></script>
 */

(function () {

  const canvas = document.getElementById('spark-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    nodes.forEach(n => {
      if (n.x > W) n.x = Math.random() * W;
      if (n.y > H) n.y = Math.random() * H;
    });
  }

  const NODE_COUNT = 45;
  const nodes = [];

  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push({
      x:  Math.random() * (window.innerWidth  || 800),
      y:  Math.random() * (window.innerHeight || 600),
      vx: (Math.random() - .5) * .35,
      vy: (Math.random() - .5) * .35,
    });
  }

  const bolts = [];

  function buildLightning(x1, y1, x2, y2, depth) {
    if (depth === 0) return [[x1, y1], [x2, y2]];
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const perp = len * .2;
    const ox = (-dy / len) * perp * (Math.random() - .5) * 2;
    const oy = ( dx / len) * perp * (Math.random() - .5) * 2;
    return [...buildLightning(x1, y1, mx+ox, my+oy, depth-1).slice(0,-1),
            ...buildLightning(mx+ox, my+oy, x2, y2, depth-1)];
  }

  function spawnBolt(ax, ay, bx, by, fast) {
    const dist = Math.hypot(bx-ax, by-ay);
    if (dist < 30 || dist > 320) return;
    bolts.push({
      ax, ay, bx, by,
      life:  1,
      decay: fast ? .07 : (.03 + Math.random() * .04),
      segs:  buildLightning(ax, ay, bx, by, 3),
      width: .4 + Math.random() * .9,
      blue:  Math.random() > .28,
    });
  }

  function trySpawnBolt() {
    const a = nodes[Math.floor(Math.random() * nodes.length)];
    const b = nodes[Math.floor(Math.random() * nodes.length)];
    if (a !== b) spawnBolt(a.x, a.y, b.x, b.y, false);
  }

  const flashes = [];

  function spawnFlash(x, y, big) {
    flashes.push({ x, y, r: 0, life: 1, decay: big ? .07 : .11 });
  }

  const dust = [];
  for (let i = 0; i < 65; i++) {
    dust.push({
      x: Math.random() * 800, y: Math.random() * 600,
      r: .4 + Math.random() * .9,
      alpha: .08 + Math.random() * .25,
      vx: (Math.random() - .5) * .18,
      vy: (Math.random() - .5) * .18,
    });
  }

  let frame = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = 'rgba(0,120,200,0.04)';
    ctx.lineWidth = .5;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // move nodes
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    });

    // dust
    dust.forEach(d => {
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0) d.x = W; if (d.x > W) d.x = 0;
      if (d.y < 0) d.y = H; if (d.y > H) d.y = 0;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(0,180,255,${d.alpha})`; ctx.fill();
    });

    // field lines
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i+1; j < nodes.length; j++) {
        const dist = Math.hypot(nodes[i].x-nodes[j].x, nodes[i].y-nodes[j].y);
        if (dist < 160) {
          const a = (1 - dist/160) * .1;
          ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(0,160,255,${a})`; ctx.lineWidth = .35; ctx.stroke();
        }
      }
    }

    // node dots
    nodes.forEach(n => {
      ctx.beginPath(); ctx.arc(n.x, n.y, 1.4, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(0,200,255,0.3)'; ctx.fill();
    });

    // bolts
    for (let i = bolts.length-1; i >= 0; i--) {
      const b = bolts[i];
      b.life -= b.decay;
      if (b.life <= 0) { bolts.splice(i,1); continue; }
      const alpha   = b.life * .9;
      const coreRGB = b.blue ? '180,240,255' : '200,160,255';
      const glowRGB = b.blue ? '0,200,255'   : '130,70,255';
      ctx.beginPath(); ctx.moveTo(b.segs[0][0], b.segs[0][1]);
      b.segs.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.strokeStyle = `rgba(${glowRGB},${alpha*.35})`; ctx.lineWidth = b.width*5; ctx.lineJoin='round'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(b.segs[0][0], b.segs[0][1]);
      b.segs.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.strokeStyle = `rgba(${coreRGB},${alpha})`; ctx.lineWidth = b.width; ctx.stroke();
    }

    // flashes
    for (let i = flashes.length-1; i >= 0; i--) {
      const f = flashes[i];
      f.r += 1.2; f.life -= f.decay;
      if (f.life <= 0) { flashes.splice(i,1); continue; }
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(180,240,255,${f.life*.55})`; ctx.lineWidth = .9; ctx.stroke();
    }

    if (frame%20===0 && Math.random()>.25) trySpawnBolt();
    if (frame%9 ===0 && Math.random()>.55) trySpawnBolt();
    if (frame%35===0 && Math.random()>.3)  trySpawnBolt();
    if (frame%14===0 && Math.random()>.45) {
      const n = nodes[Math.floor(Math.random()*nodes.length)];
      spawnFlash(n.x, n.y, false);
    }

    frame++;
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();

  document.addEventListener('mousemove', function(e) {
    let closest = null, cd = Infinity;
    nodes.forEach(n => { const d = Math.hypot(n.x-e.clientX, n.y-e.clientY); if(d<cd){cd=d;closest=n;} });
    if (closest && cd < 200) {
      closest.x += (e.clientX - closest.x) * .035;
      closest.y += (e.clientY - closest.y) * .035;
      if (Math.random() > .72) trySpawnBolt();
    }
  });

  document.addEventListener('click', function(e) {
    for (let i = 0; i < 7; i++) {
      const n = nodes[Math.floor(Math.random()*nodes.length)];
      spawnBolt(e.clientX, e.clientY, n.x, n.y, true);
    }
    spawnFlash(e.clientX, e.clientY, true);
  });

})();
