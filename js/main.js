(function () {
  "use strict";

  var grid = document.getElementById("character-grid");
  var modalOverlay = document.getElementById("modal-overlay");
  var modalContent = document.getElementById("modal-content");
  var modalClose = document.getElementById("modal-close");
  var searchInput = document.getElementById("search-input");
  var resultCount = document.getElementById("result-count");
  var sortSelect = document.getElementById("sort-select");
  var favOnlyCheck = document.getElementById("fav-only");

  var elementTags = document.querySelectorAll("#element-filters .tag");
  var regionTags = document.querySelectorAll("#region-filters .tag");
  var rarityTags = document.querySelectorAll("#rarity-filters .tag");
  var weaponTags = document.querySelectorAll("#weapon-filters .tag");

  var activeElement = "all";
  var activeRegion = "all";
  var activeRarity = "all";
  var activeWeapon = "all";
  var searchQuery = "";
  var sortMode = "default";
  var favOnly = false;

  // ---- localStorage 收藏 & 置顶 ----
  var STORAGE_KEY_FAV = "genshin_favorites";
  var STORAGE_KEY_PIN = "genshin_pins";

  function loadSet(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (e) {
      return new Set();
    }
  }

  function loadArray(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveSet(key, s) {
    localStorage.setItem(key, JSON.stringify(Array.from(s)));
  }

  var favSet = loadSet(STORAGE_KEY_FAV);
  var pinList = loadArray(STORAGE_KEY_PIN); // 有序数组，最新置顶在最前

  function isFav(id) { return favSet.has(id); }
  function isPinned(id) { return pinList.indexOf(id) >= 0; }

  function toggleFav(id) {
    if (favSet.has(id)) favSet.delete(id); else favSet.add(id);
    saveSet(STORAGE_KEY_FAV, favSet);
    render();
  }

  function togglePin(id) {
    var idx = pinList.indexOf(id);
    if (idx >= 0) {
      pinList.splice(idx, 1);
    } else {
      pinList.push(id); // 最新置顶放在最后
    }
    localStorage.setItem(STORAGE_KEY_PIN, JSON.stringify(pinList));
    render();
  }

  var elementClassMap = {
    "火": "pyro",
    "水": "hydro",
    "风": "anemo",
    "雷": "electro",
    "冰": "cryo",
    "草": "dendro",
    "岩": "geo",
    "无": "none"
  };

  // Enka Network 角色图标名映射
  var enkaIconMap = {
    diluc: "Diluc", hutao: "Hutao", bennett: "Bennett",
    klee: "Klee", amber: "Ambor", xiangling: "Xiangling",
    yanfei: "Feiyan", xinyan: "Xinyan", mavuika: "Mavuika",
    tartaglia: "Tartaglia", furina: "Furina", xingqiu: "Xingqiu",
    mona: "Mona", barbara: "Barbara", yelan: "Yelan",
    venti: "Venti", xiao: "Xiao", kazuha: "Kazuha",
    jean: "Qin", sucrose: "Sucrose",
    raiden: "Shougun", yae: "Yae", keqing: "Keqing",
    lisa: "Lisa", fischl: "Fischl", beidou: "Beidou",
    ganyu: "Ganyu", ayaka: "Ayaka", qiqi: "Qiqi",
    eula: "Eula", kaeya: "Kaeya", rosaria: "Rosaria",
    diona: "Diona", shenhe: "Shenhe", chongyun: "Chongyun",
    chasca: "Chasca", nahida: "Nahida", alhaitham: "Alhatham",
    tighnari: "Tighnari", yaoyao: "Yaoyao",
    zhongli: "Zhongli", albedo: "Albedo", itto: "Itto",
    noelle: "Noel", ningguang: "Ningguang", yunjin: "Yunjin",
    xilonen: "Xilonen", aether: "PlayerBoy", lumine: "PlayerGirl"
  };

  function getIconUrl(charId) {
    var name = enkaIconMap[charId];
    if (!name) return "";
    return "https://enka.network/ui/UI_AvatarIcon_" + name + ".png";
  }

  // ---- 角色卡片 ----
  function createCard(char, index) {
    var elemClass = elementClassMap[char.element] || "none";
    var iconUrl = getIconUrl(char.id);
    var stars = "";
    for (var s = 0; s < char.rarity; s++) stars += "★";

    var div = document.createElement("div");
    div.className = "card";
    if (isPinned(char.id)) div.classList.add("pinned");
    div.setAttribute("data-id", char.id);
    div.style.setProperty("--i", index);

    var favCls = isFav(char.id) ? " fav-active" : "";
    var pinCls = isPinned(char.id) ? " pin-active" : "";

    div.innerHTML =
      '<div class="card-actions">' +
        '<button class="card-action-btn' + favCls + '" data-action="fav" title="收藏">&#9829;</button>' +
        '<button class="card-action-btn' + pinCls + '" data-action="pin" title="置顶">&#9733;</button>' +
      '</div>' +
      '<div class="card-portrait ' + elemClass + '">' +
        '<div class="card-portrait-glow"></div>' +
        '<img class="card-portrait-img" src="' + iconUrl + '" alt="' + char.name + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
        '<div class="card-portrait-icon" style="display:none">' + char.name[0] + '</div>' +
      '</div>' +
      '<div class="card-info">' +
        '<div class="card-name">' + char.name + '</div>' +
        '<div class="card-title">' + (char.cardTitle || char.title) + '</div>' +
        '<div class="card-meta">' +
          '<span>' + char.element + '</span>' +
          '<span>' + char.region + '</span>' +
        '</div>' +
        '<div class="card-meta card-meta-weapon">' +
          '<span>' + char.weapon + '</span>' +
        '</div>' +
        '<div class="card-stars">' + stars + '</div>' +
      '</div>';

    // 收藏/置顶按钮事件
    div.querySelector('[data-action="fav"]').addEventListener("click", function (e) {
      e.stopPropagation();
      toggleFav(char.id);
    });
    div.querySelector('[data-action="pin"]').addEventListener("click", function (e) {
      e.stopPropagation();
      togglePin(char.id);
    });

    // 点击卡片打开弹窗
    div.addEventListener("click", function (e) {
      if (e.target.closest(".card-actions")) return;
      openModal(char);
    });

    return div;
  }

  // ---- 弹窗 ----
  function openModal(char) {
    var elemClass = elementClassMap[char.element] || "none";
    var iconUrl = getIconUrl(char.id);
    var stars = "";
    for (var s = 0; s < char.rarity; s++) stars += "★";

    var specialtiesHtml = char.specialties.map(function (s) { return "<li>" + s + "</li>"; }).join("");

    var skillsHtml = "";
    if (char.skills) {
      var typeLabels = ["普通攻击", "元素战技", "元素爆发"];
      skillsHtml = '<div class="detail-section"><h3>技能天赋</h3><div class="skill-list">';
      for (var si = 0; si < char.skills.length; si++) {
        var sk = char.skills[si];
        skillsHtml += '<div class="skill-card"><div class="skill-name">' + sk.name + '</div><div class="skill-tag">' + typeLabels[si] + '</div><p class="skill-desc">' + sk.desc + '</p></div>';
      }
      skillsHtml += '</div></div>';
    }

    var consHtml = "";
    if (char.constellation) {
      consHtml = '<div class="detail-section"><h3>命之座 · ' + char.constellation.name + '</h3><div class="constellation-list">';
      for (var ci = 0; ci < char.constellation.levels.length; ci++) {
        var cl = char.constellation.levels[ci];
        consHtml += '<div class="constellation-item"><div class="constellation-index">' + (ci + 1) + '</div><div class="constellation-body"><div class="constellation-name">' + cl.name + '</div><div class="constellation-effect">' + cl.effect + '</div></div></div>';
      }
      consHtml += '</div></div>';
    }

    var relationsHtml = "";
    if (char.relations && char.relations.length > 0) {
      relationsHtml =
        '<div class="relation-canvas-wrap">' +
          '<div class="detail-section"><h3>羁绊</h3></div>' +
          '<canvas class="relation-graph" data-id="' + char.id + '" height="340"></canvas>' +
          '<div class="relation-list" style="padding:0 16px 16px">';
      for (var ri = 0; ri < char.relations.length; ri++) {
        var r = char.relations[ri];
        relationsHtml += '<div class="relation-card"><div class="relation-names"><strong>' + r.name + '</strong> · ' + r.relation + '</div><p class="relation-note">' + r.note + '</p></div>';
      }
      relationsHtml += '</div></div>';
    }

    // 经典台词
    var quotesHtml = "";
    if (char.quotes && char.quotes.length > 0) {
      quotesHtml = '<div class="detail-section"><h3>经典台词</h3><div class="quote-list">';
      for (var qi = 0; qi < char.quotes.length; qi++) {
        var q = char.quotes[qi];
        quotesHtml +=
          '<div class="quote-item">' +
            '<div class="quote-text">"' + q.text + '"</div>' +
            '<div class="quote-context">—— ' + q.context + '</div>' +
          '</div>';
      }
      quotesHtml += '</div></div>';
    }

    var birthdayTag = char.birthday ? '<span class="meta-birthday">' + char.birthday + '</span>' : '';

    modalContent.innerHTML =
      '<div class="modal-portrait ' + elemClass + '">' +
        '<img class="modal-portrait-img" src="' + iconUrl + '" alt="' + char.name + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
        '<div class="modal-portrait-icon" style="display:none">' + char.name[0] + '</div>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div class="detail-name">' + char.name + '</div>' +
        '<div class="detail-title">' + char.title + '</div>' +
        '<div class="detail-meta">' +
          '<span>' + stars + '</span>' +
          '<span>' + char.element + '</span>' +
          '<span>' + char.region + '</span>' +
          '<span>' + char.weapon + '</span>' +
          birthdayTag +
        '</div>' +
        quotesHtml +
        '<div class="detail-section"><h3>角色故事</h3><p>' + char.story + '</p></div>' +
        '<div class="detail-section"><h3>性格特点</h3><p>' + char.personality + '</p></div>' +
        '<div class="detail-section"><h3>擅长之事</h3><ul>' + specialtiesHtml + '</ul></div>' +
        relationsHtml +
        skillsHtml +
        consHtml +
      '</div>';

    modalOverlay.classList.add("show");
    document.body.style.overflow = "hidden";
    modalOverlay.querySelector(".modal").scrollTop = 0;

    // 绘制关系图
    setTimeout(function () { drawRelationGraph(char); }, 150);
  }

  // ---- 个人关系图 ----
  var relIconCache = {};

  function loadRelIcon(id, callback) {
    if (relIconCache[id]) { callback(relIconCache[id]); return; }
    var url = getIconUrl(id);
    if (!url) { callback(null); return; }
    var img = new Image();
    img.onload = function () { relIconCache[id] = img; callback(img); };
    img.onerror = function () { relIconCache[id] = null; callback(null); };
    img.src = url;
  }

  function drawRelationGraph(char) {
    var canvas = document.querySelector('.relation-graph[data-id="' + char.id + '"]');
    if (!canvas) return;

    var relations = char.relations || [];
    if (relations.length === 0) return;

    var dpr = window.devicePixelRatio || 1;
    var w = canvas.parentElement.clientWidth - 32;
    // 响应式高度和尺寸
    var maxH = parseInt(canvas.getAttribute("height")) || 340;
    var h = maxH;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    var ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // 响应式尺寸
    var isSmall = w < 400;
    var cx = w / 2;
    var cy = h / 2;
    var centerR = 32;
    var outerR = 24;
    var nameH = 13;
    var orbitR = Math.min(w, h) / 2 - outerR - nameH - 8;
    var angleStep = (Math.PI * 2) / relations.length;
    var startAngle = -Math.PI / 2;

    // 查找关联角色
    var relatedChars = [];
    for (var i = 0; i < relations.length; i++) {
      for (var j = 0; j < characters.length; j++) {
        if (characters[j].name === relations[i].name) {
          relatedChars.push({ char: characters[j], relation: relations[i].relation });
          break;
        }
      }
    }

    // 确保中心角色图标已加载
    loadRelIcon(char.id, function (centerImg) {

      // 加载所有关联角色图标
      var loaded = 0;
      var total = relatedChars.length;

      function tryDraw() {
        loaded++;
        if (loaded >= total) doDraw();
      }
      if (total === 0) doDraw();

      for (var k = 0; k < relatedChars.length; k++) {
        relatedChars[k].pos = {
          x: cx + Math.cos(startAngle + k * angleStep) * orbitR,
          y: cy + Math.sin(startAngle + k * angleStep) * orbitR
        };
        loadRelIcon(relatedChars[k].char.id, tryDraw);
      }

      function doDraw() {
        ctx.clearRect(0, 0, w, h);

        // 连线
        for (var li = 0; li < relatedChars.length; li++) {
          var rc = relatedChars[li];
          var mx = (cx + rc.pos.x) / 2;
          var my = (cy + rc.pos.y) / 2;

          // 连线 — 从中心边缘到关联节点边缘
          var dx2 = rc.pos.x - cx;
          var dy2 = rc.pos.y - cy;
          var len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          var ux = dx2 / len2;
          var uy = dy2 / len2;
          var sx = cx + ux * centerR;
          var sy = cy + uy * centerR;
          var ex = rc.pos.x - ux * outerR;
          var ey = rc.pos.y - uy * outerR;

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.strokeStyle = "rgba(201,169,110,0.5)";
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // 标签 — 统一盖在连线中点上方
          ctx.font = (isSmall ? "bold 9px" : "bold 11px") + " 'PingFang SC','Microsoft YaHei',sans-serif";
          var tw = ctx.measureText(rc.relation).width;
          var lx = mx;
          var ly = my + 1;

          ctx.fillStyle = "rgba(8,12,40,0.9)";
          ctx.fillRect(lx - tw / 2 - 6, ly - 8, tw + 12, 16);
          ctx.strokeStyle = "rgba(201,169,110,0.3)";
          ctx.lineWidth = 0.5;
          ctx.strokeRect(lx - tw / 2 - 6, ly - 8, tw + 12, 16);

          ctx.fillStyle = "rgba(201,169,110,0.85)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(rc.relation, lx, ly);
        }

        // 关联节点
        for (var ni = 0; ni < relatedChars.length; ni++) {
          var rch = relatedChars[ni];
          var nx = rch.pos.x;
          var ny = rch.pos.y;

          var rimg = relIconCache[rch.char.id];
          if (rimg) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(nx, ny, outerR, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(rimg, nx - outerR, ny - outerR, outerR * 2, outerR * 2);
            ctx.restore();
          } else {
            ctx.beginPath();
            ctx.arc(nx, ny, outerR, 0, Math.PI * 2);
            ctx.fillStyle = "#555";
            ctx.fill();
          }
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.font = (isSmall ? "8px" : "bold 10px") + " 'PingFang SC','Microsoft YaHei',sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(rch.char.name, nx, ny + outerR + (isSmall ? 9 : 11));
        }

        // 中心节点（最后画，在最上层）
        if (centerImg) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, centerR, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(centerImg, cx - centerR, cy - centerR, centerR * 2, centerR * 2);
          ctx.restore();
        }
        // 中心光环
        ctx.beginPath();
        ctx.arc(cx, cy, centerR + 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(201,169,110,0.5)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.font = (isSmall ? "8px" : "bold 10px") + " 'PingFang SC','Microsoft YaHei',sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(char.name, cx, cy + centerR + (isSmall ? 9 : 12));
      }
    });
  }

  function closeModal() {
    modalOverlay.classList.remove("show");
    document.body.style.overflow = "";
  }

  modalClose.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", function (e) { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modalOverlay.classList.contains("show")) closeModal(); });

  // ---- 筛选 ----
  function matches(char) {
    if (activeElement !== "all" && char.element !== activeElement) return false;
    if (activeRegion !== "all" && char.region !== activeRegion) return false;
    if (activeRarity !== "all" && String(char.rarity) !== activeRarity) return false;
    if (activeWeapon !== "all" && char.weapon !== activeWeapon) return false;
    if (searchQuery && char.name.indexOf(searchQuery) === -1) return false;
    if (favOnly && !favSet.has(char.id)) return false;
    return true;
  }

  // ---- 排序 ----
  function sortChars(list) {
    if (sortMode === "rarity-desc") {
      list.sort(function (a, b) { return b.rarity - a.rarity; });
    } else if (sortMode === "birthday") {
      list.sort(function (a, b) {
        var da = a.birthday, db = b.birthday;
        if (!da || da.indexOf("月") === -1) return 1;
        if (!db || db.indexOf("月") === -1) return -1;
        var ma = parseInt(da), mb = parseInt(db);
        var da2 = da.split("月")[1], db2 = db.split("月")[1];
        var daya = da2 ? parseInt(da2) : 99;
        var dayb = db2 ? parseInt(db2) : 99;
        if (ma !== mb) return ma - mb;
        return daya - dayb;
      });
    }
  }

  function render() {
    grid.innerHTML = "";

    var filtered = [];
    for (var i = 0; i < characters.length; i++) {
      if (matches(characters[i])) filtered.push(characters[i]);
    }

    sortChars(filtered);

    // 置顶角色按置顶顺序排最前
    var pinned = [], rest = [];
    for (var j = 0; j < filtered.length; j++) {
      if (pinList.indexOf(filtered[j].id) >= 0) pinned.push(filtered[j]);
      else rest.push(filtered[j]);
    }
    // 按 pinList 顺序排列置顶角色
    pinned.sort(function (a, b) {
      return pinList.indexOf(a.id) - pinList.indexOf(b.id);
    });
    var sorted = pinned.concat(rest);

    if (sorted.length === 0) {
      var noDiv = document.createElement("div");
      noDiv.className = "no-results";
      noDiv.innerHTML = '<div class="no-icon">✦</div><p>这片星域暂无记录，试试调整筛选吧</p>';
      grid.appendChild(noDiv);
    } else {
      for (var k = 0; k < sorted.length; k++) {
        grid.appendChild(createCard(sorted[k], k));
      }
    }

    resultCount.textContent = "✦ 共 " + sorted.length + " 位旅人";
  }

  function setActiveTag(tagList, value) {
    tagList.forEach(function (t) {
      t.classList.toggle("active", t.getAttribute("data-value") === value);
    });
  }

  // ---- 事件绑定 ----
  elementTags.forEach(function (tag) {
    tag.addEventListener("click", function () {
      activeElement = this.getAttribute("data-value");
      setActiveTag(elementTags, activeElement);
      render();
    });
  });

  regionTags.forEach(function (tag) {
    tag.addEventListener("click", function () {
      activeRegion = this.getAttribute("data-value");
      setActiveTag(regionTags, activeRegion);
      render();
    });
  });

  rarityTags.forEach(function (tag) {
    tag.addEventListener("click", function () {
      activeRarity = this.getAttribute("data-value");
      setActiveTag(rarityTags, activeRarity);
      render();
    });
  });

  weaponTags.forEach(function (tag) {
    tag.addEventListener("click", function () {
      activeWeapon = this.getAttribute("data-value");
      setActiveTag(weaponTags, activeWeapon);
      render();
    });
  });

  searchInput.addEventListener("input", function () {
    searchQuery = this.value.trim();
    render();
  });

  sortSelect.addEventListener("change", function () {
    sortMode = this.value;
    render();
  });

  favOnlyCheck.addEventListener("change", function () {
    favOnly = this.checked;
    render();
  });

  // ---- 今日寿星 ----
  function checkBirthday() {
    var now = new Date();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var today = month + "月" + day + "日";

    var birthdayChars = [];
    for (var i = 0; i < characters.length; i++) {
      if (characters[i].birthday === today) {
        birthdayChars.push(characters[i]);
      }
    }

    var banner = document.getElementById("birthday-banner");
    if (birthdayChars.length === 0) {
      banner.style.display = "none";
      return;
    }

    var iconsHtml = "";
    for (var j = 0; j < birthdayChars.length; j++) {
      var bc = birthdayChars[j];
      var iconUrl = getIconUrl(bc.id);
      iconsHtml +=
        '<div class="birthday-char" data-id="' + bc.id + '">' +
          '<img class="birthday-char-icon" src="' + iconUrl + '" alt="' + bc.name + '" onerror="this.style.display=\'none\'">' +
          '<div>' +
            '<div class="birthday-char-name">' + bc.name + '</div>' +
            '<div class="birthday-char-meta">' + bc.element + ' · ' + bc.region + '</div>' +
          '</div>' +
        '</div>';
    }

    banner.innerHTML =
      '<div class="birthday-banner-title"><span class="cake">🎂</span> 今日寿星</div>' +
      '<div class="birthday-chars">' + iconsHtml + '</div>';
    banner.style.display = "block";

    // 点击寿星卡片打开弹窗
    banner.querySelectorAll(".birthday-char").forEach(function (el) {
      el.addEventListener("click", function () {
        var cid = el.getAttribute("data-id");
        for (var k = 0; k < characters.length; k++) {
          if (characters[k].id === cid) { openModal(characters[k]); break; }
        }
      });
    });
  }

  render();
  checkBirthday();

})();
