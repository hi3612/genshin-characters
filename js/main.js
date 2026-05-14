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

  function saveSet(key, s) {
    localStorage.setItem(key, JSON.stringify(Array.from(s)));
  }

  var favSet = loadSet(STORAGE_KEY_FAV);
  var pinSet = loadSet(STORAGE_KEY_PIN);

  function isFav(id) { return favSet.has(id); }
  function isPinned(id) { return pinSet.has(id); }

  function toggleFav(id) {
    if (favSet.has(id)) favSet.delete(id); else favSet.add(id);
    saveSet(STORAGE_KEY_FAV, favSet);
    render();
  }

  function togglePin(id) {
    if (pinSet.has(id)) pinSet.delete(id); else pinSet.add(id);
    saveSet(STORAGE_KEY_PIN, pinSet);
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
        '<div class="card-title">' + char.title + '</div>' +
        '<div class="card-meta">' +
          '<span>' + char.element + '</span>' +
          '<span>' + char.region + '</span>' +
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
      relationsHtml = '<div class="detail-section"><h3>羁绊</h3><div class="relation-list">';
      for (var ri = 0; ri < char.relations.length; ri++) {
        var r = char.relations[ri];
        relationsHtml += '<div class="relation-card"><div class="relation-names"><strong>' + r.name + '</strong> · ' + r.relation + '</div><p class="relation-note">' + r.note + '</p></div>';
      }
      relationsHtml += '</div></div>';
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

    // 置顶角色排最前
    var pinned = [], rest = [];
    for (var j = 0; j < filtered.length; j++) {
      if (pinSet.has(filtered[j].id)) pinned.push(filtered[j]);
      else rest.push(filtered[j]);
    }
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

    resultCount.textContent = "共 " + sorted.length + " 位角色";
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

  render();

})();
