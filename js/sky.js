(function () {
  "use strict";

  var canvas = document.getElementById("sky-canvas");
  var ctx = canvas.getContext("2d");
  var stars = [];
  var STAR_COUNT = 680;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    for (var i = 0; i < STAR_COUNT; i++) {
      var t = Math.random();  // 沿河带的位置 (0→1 从左上到右下)
      var inRiver = Math.random() < 0.68;

      var x, y;
      if (inRiver) {
        // 河带主轴：窄屏偏上，宽屏居中
        var isNarrow = window.innerWidth < 600;
        var bandTop = isNarrow ? 0.08 : 0.28;
        var bandBot = isNarrow ? 0.35 : 0.58;
        var cx = 0.05 + t * 0.90;
        var cy = bandTop + t * (bandBot - bandTop);
        // 轻微波浪
        cy += Math.sin(t * Math.PI * 3.2) * 0.025;
        var offset = (Math.random() - 0.5) * 0.16;
        x = cx + offset * 0.5;
        y = cy + offset;
      } else {
        x = Math.random();
        y = Math.random();
      }

      // 颜色：河内偏暖色多，河外偏冷色
      var colorType = Math.random();
      var r, g, b;
      if (inRiver && colorType < 0.30) {
        r = 255; g = 220 + Math.floor(Math.random() * 35); b = 145 + Math.floor(Math.random() * 55);
      } else if (colorType < 0.55) {
        r = 175 + Math.floor(Math.random() * 80); g = 195 + Math.floor(Math.random() * 60); b = 255;
      } else if (colorType < 0.75) {
        var v = 210 + Math.floor(Math.random() * 45);
        r = v; g = v; b = v;
      } else if (colorType < 0.90) {
        r = 180 + Math.floor(Math.random() * 45); g = 140 + Math.floor(Math.random() * 35); b = 215 + Math.floor(Math.random() * 40);
      } else {
        r = 120 + Math.floor(Math.random() * 40); g = 200 + Math.floor(Math.random() * 55); b = 215 + Math.floor(Math.random() * 40);
      }

      stars.push({
        x: x, y: y,
        r: r, g: g, b: b,
        size: Math.random() < 0.06 ? (2.0 + Math.random() * 2.0) : (0.5 + Math.random() * 1.3),
        brightness: 0.35 + Math.random() * 0.65,
        twinkleSpeed: 0.002 + Math.random() * 0.007,
        twinkleOffset: Math.random() * Math.PI * 2
      });
    }
    stars.sort(function (a, b) { return a.y - b.y; });
  }

  function draw(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var w = canvas.width;
    var h = canvas.height;

    // ---- 柔和的光带背景（天の川本体） ----
    // 多条渐变叠加，模拟《你的名字》中星河弥漫的光晕
    var bandGrad = ctx.createLinearGradient(0, h * 0.15, w * 0.85, h * 0.65);
    bandGrad.addColorStop(0, "rgba(70,40,140,0.02)");
    bandGrad.addColorStop(0.12, "rgba(100,60,180,0.08)");
    bandGrad.addColorStop(0.25, "rgba(60,80,180,0.06)");
    bandGrad.addColorStop(0.4, "rgba(110,70,180,0.09)");
    bandGrad.addColorStop(0.5, "rgba(70,100,190,0.07)");
    bandGrad.addColorStop(0.6, "rgba(100,60,160,0.08)");
    bandGrad.addColorStop(0.75, "rgba(60,50,140,0.05)");
    bandGrad.addColorStop(0.9, "rgba(70,35,120,0.04)");
    bandGrad.addColorStop(1, "rgba(40,20,80,0.02)");

    ctx.fillStyle = bandGrad;
    ctx.fillRect(0, 0, w, h);

    // 第二层 — 更宽更淡的弥散光
    var bandGrad2 = ctx.createLinearGradient(0, h * 0.10, w, h * 0.70);
    bandGrad2.addColorStop(0, "rgba(30,20,80,0.02)");
    bandGrad2.addColorStop(0.2, "rgba(60,40,120,0.05)");
    bandGrad2.addColorStop(0.45, "rgba(80,50,140,0.04)");
    bandGrad2.addColorStop(0.7, "rgba(50,30,100,0.03)");
    bandGrad2.addColorStop(1, "rgba(20,10,50,0.01)");
    ctx.fillStyle = bandGrad2;
    ctx.fillRect(0, 0, w, h);

    // 顶部微弱的暖色辉光（黄昏残余）
    var topGlow = ctx.createRadialGradient(w * 0.7, h * 0.15, 0, w * 0.7, h * 0.15, w * 0.7);
    topGlow.addColorStop(0, "rgba(200,140,80,0.04)");
    topGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, w, h);

    // ---- 画星星 ----
    var drift = time * 0.00002; // 极缓慢的横向微移
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      // 极缓漂移
      var sx = (s.x + drift) % 1;
      if (sx < 0) sx += 1;
      var sy = s.y;

      var px = sx * w;
      var py = sy * h;

      var twinkle = Math.sin(time * s.twinkleSpeed + s.twinkleOffset) * 0.22 + 0.78;
      var alpha = Math.min(0.92, s.brightness * twinkle);

      ctx.beginPath();
      ctx.arc(px, py, s.size, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + s.r + "," + s.g + "," + s.b + "," + alpha.toFixed(3) + ")";

      if (s.size > 1.8 && alpha > 0.55) {
        ctx.shadowColor = "rgba(" + s.r + "," + s.g + "," + s.b + ",0.45)";
        ctx.shadowBlur = s.size * 3.5;
      } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }

      ctx.fill();
    }
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
  }

  // ---- 流星系统 ----
  var activeMeteors = [];
  var MAX_METEORS = 7;
  var meteorTimer = null;

  function createMeteor() {
    var w = canvas.width;
    var h = canvas.height;

    // 起点 — 左上象限
    var sx = Math.random() * w * 0.45;
    var sy = Math.random() * h * 0.18;

    // 终点方向 — 右下
    var ex = sx + w * 0.3 + Math.random() * w * 0.5;
    var ey = sy + h * 0.15 + Math.random() * h * 0.25;

    var life = 0;
    var maxLife = 200 + Math.random() * 120;
    var trail = [];
    // 弧形 — 多数抛物线向下弯曲（重力感），少数直线
    var arcHeight;
    if (Math.random() < 0.75) {
      // 75% 概率：向下抛物线弯曲
      arcHeight = 0.05 + Math.random() * 0.12;
    } else {
      // 25% 概率：接近直线
      arcHeight = (Math.random() - 0.5) * 0.015;
    }

    // 颜色主题 — 六种颜色随机
    var colorThemes = [
      { r: 255, g: 220, b: 140 },  // 暖金
      { r: 200, g: 210, b: 255 },  // 淡蓝
      { r: 255, g: 255, b: 255 },  // 纯白
      { r: 210, g: 160, b: 230 },  // 淡紫
      { r: 140, g: 220, b: 210 },  // 青绿
      { r: 255, g: 175, b: 175 },  // 淡粉
    ];
    var theme = colorThemes[Math.floor(Math.random() * colorThemes.length)];
    var headR = theme.r;
    var headG = theme.g;
    var headB = theme.b;

    // 碎裂粒子
    var sparks = [];

    function draw() {
      if (life >= maxLife) {
        var idx = activeMeteors.indexOf(draw);
        if (idx >= 0) activeMeteors.splice(idx, 1);
        return;
      }
      life++;
      var t = life / maxLife;
      var px = sx + (ex - sx) * t;
      var drop = arcHeight * h * t * t;
      var py = sy + (ey - sy) * t + drop;

      trail.push({ x: px, y: py });
      if (trail.length > 110) trail.shift();

      // 生成碎裂粒子（靠近头部时随机产生）
      if (life > 10 && Math.random() < 0.35) {
        sparks.push({
          x: px + (Math.random() - 0.5) * 4,
          y: py + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 0.8,
          vy: Math.random() * 0.6 + 0.2,
          life: 0,
          maxLife: 25 + Math.random() * 40,
          r: headR, g: headG, b: headB
        });
      }

      ctx.save();

      // 尾迹 — 外层弥散光晕
      if (trail.length > 1) {
        ctx.beginPath();
        for (var si = 0; si < trail.length; si += 3) {
          var tp = trail[si];
          if (si === 0) ctx.moveTo(tp.x, tp.y);
          else ctx.lineTo(tp.x, tp.y);
        }
        ctx.strokeStyle = "rgba(" + headR + "," + headG + "," + headB + ",0.04)";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // 尾迹 — 中层柔光
      if (trail.length > 1) {
        ctx.beginPath();
        for (var si2 = 0; si2 < trail.length; si2 += 2) {
          var tp2 = trail[si2];
          if (si2 === 0) ctx.moveTo(tp2.x, tp2.y);
          else ctx.lineTo(tp2.x, tp2.y);
        }
        ctx.strokeStyle = "rgba(" + headR + "," + headG + "," + headB + ",0.10)";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // 尾迹 — 核心线（渐变，头亮尾暗）
      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (var si3 = 1; si3 < trail.length; si3++) {
          ctx.lineTo(trail[si3].x, trail[si3].y);
        }
        var grad = ctx.createLinearGradient(
          trail[0].x, trail[0].y,
          trail[trail.length - 1].x, trail[trail.length - 1].y
        );
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.6, "rgba(255,255,255,0.25)");
        grad.addColorStop(1, "rgba(255,255,255,0.75)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.8;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // 碎裂粒子
      for (var pi = sparks.length - 1; pi >= 0; pi--) {
        var sp = sparks[pi];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.life++;
        if (sp.life >= sp.maxLife) {
          sparks.splice(pi, 1);
          continue;
        }
        var fade = 1 - sp.life / sp.maxLife;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 0.6 + fade * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + sp.r + "," + sp.g + "," + sp.b + "," + (fade * 0.6).toFixed(2) + ")";
        ctx.fill();
      }

      // 头部 — 外层辉光
      if (trail.length > 0) {
        var head = trail[trail.length - 1];
        ctx.beginPath();
        ctx.arc(head.x, head.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + headR + "," + headG + "," + headB + ",0.15)";
        ctx.shadowColor = "rgba(" + headR + "," + headG + "," + headB + ",0.4)";
        ctx.shadowBlur = 12;
        ctx.fill();

        // 中层辉光
        ctx.beginPath();
        ctx.arc(head.x, head.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + headR + "," + headG + "," + headB + ",0.45)";
        ctx.shadowBlur = 0;
        ctx.fill();

        // 核心点
        ctx.beginPath();
        ctx.arc(head.x, head.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fill();
      }

      ctx.restore();

      if (life < maxLife) requestAnimationFrame(draw);
      else {
        var idx = activeMeteors.indexOf(draw);
        if (idx >= 0) activeMeteors.splice(idx, 1);
      }
    }

    activeMeteors.push(draw);
    requestAnimationFrame(draw);
  }

  function scheduleMeteor() {
    if (meteorTimer) clearTimeout(meteorTimer);
    meteorTimer = setTimeout(function () {
      if (activeMeteors.length < MAX_METEORS) {
        createMeteor();
        // 偶尔成对
        if (Math.random() < 0.25 && activeMeteors.length < MAX_METEORS) {
          setTimeout(function () {
            if (activeMeteors.length < MAX_METEORS) createMeteor();
          }, 200 + Math.random() * 600);
        }
      }
      scheduleMeteor();
    }, 2500 + Math.random() * 4000);
  }

  function animate(time) {
    draw(time);
    requestAnimationFrame(animate);
  }

  resize();
  createStars();
  requestAnimationFrame(animate);
  setTimeout(createMeteor, 1500);
  setTimeout(function () { if (activeMeteors.length < MAX_METEORS) createMeteor(); }, 3000);
  scheduleMeteor();
  window.addEventListener("resize", function () {
    resize();
    createStars();
  });

})();
