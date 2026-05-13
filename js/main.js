(function () {
  "use strict";

  var grid = document.getElementById("character-grid");
  var modalOverlay = document.getElementById("modal-overlay");
  var modalContent = document.getElementById("modal-content");
  var modalClose = document.getElementById("modal-close");
  var searchInput = document.getElementById("search-input");
  var resultCount = document.getElementById("result-count");

  var elementTags = document.querySelectorAll("#element-filters .tag");
  var regionTags = document.querySelectorAll("#region-filters .tag");

  var activeElement = "all";
  var activeRegion = "all";
  var searchQuery = "";

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
    diluc: "Diluc",
    hutao: "Hutao",
    bennett: "Bennett",
    mavuika: "Mavuika",
    tartaglia: "Tartaglia",
    furina: "Furina",
    xingqiu: "Xingqiu",
    venti: "Venti",
    xiao: "Xiao",
    kazuha: "Kazuha",
    raiden: "Shougun",
    yae: "Yae",
    keqing: "Keqing",
    ganyu: "Ganyu",
    ayaka: "Ayaka",
    qiqi: "Qiqi",
    chasca: "Chasca",
    nahida: "Nahida",
    alhaitham: "Alhatham",
    tighnari: "Tighnari",
    zhongli: "Zhongli",
    albedo: "Albedo",
    itto: "Itto",
    xilonen: "Xilonen",
    aether: "PlayerBoy",
    lumine: "PlayerGirl"
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
    for (var s = 0; s < char.rarity; s++) {
      stars += "★";
    }

    var div = document.createElement("div");
    div.className = "card";
    div.setAttribute("data-id", char.id);
    div.style.setProperty("--i", index);

    var portraitHtml =
      '<div class="card-portrait ' + elemClass + '">' +
        '<div class="card-portrait-glow"></div>' +
        '<img class="card-portrait-img" src="' + iconUrl + '" alt="' + char.name + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
        '<div class="card-portrait-icon" style="display:none">' + char.name[0] + '</div>' +
      '</div>';

    div.innerHTML = portraitHtml +
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

    div.addEventListener("click", function () {
      openModal(char);
    });

    return div;
  }

  // ---- 弹窗 ----
  function openModal(char) {
    var elemClass = elementClassMap[char.element] || "none";
    var iconUrl = getIconUrl(char.id);
    var stars = "";
    for (var s = 0; s < char.rarity; s++) {
      stars += "★";
    }

    var specialtiesHtml = char.specialties.map(function (s) {
      return "<li>" + s + "</li>";
    }).join("");

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
        '</div>' +
        '<div class="detail-section">' +
          '<h3>角色故事</h3>' +
          '<p>' + char.story + '</p>' +
        '</div>' +
        '<div class="detail-section">' +
          '<h3>性格特点</h3>' +
          '<p>' + char.personality + '</p>' +
        '</div>' +
        '<div class="detail-section">' +
          '<h3>擅长之事</h3>' +
          '<ul>' + specialtiesHtml + '</ul>' +
        '</div>' +
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
  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modalOverlay.classList.contains("show")) closeModal();
  });

  // ---- 筛选 ----
  function matches(char) {
    if (activeElement !== "all" && char.element !== activeElement) return false;
    if (activeRegion !== "all" && char.region !== activeRegion) return false;
    if (searchQuery && char.name.indexOf(searchQuery) === -1) return false;
    return true;
  }

  function render() {
    grid.innerHTML = "";

    var filtered = [];
    for (var i = 0; i < characters.length; i++) {
      if (matches(characters[i])) {
        filtered.push(characters[i]);
      }
    }

    if (filtered.length === 0) {
      var noDiv = document.createElement("div");
      noDiv.className = "no-results";
      noDiv.innerHTML = '<div class="no-icon">✦</div><p>这片星域暂无记录，试试调整筛选吧</p>';
      grid.appendChild(noDiv);
    } else {
      for (var j = 0; j < filtered.length; j++) {
        grid.appendChild(createCard(filtered[j], j));
      }
    }

    resultCount.textContent = "共 " + filtered.length + " 位角色";
  }

  function setActiveTag(tagList, value) {
    tagList.forEach(function (t) {
      t.classList.toggle("active", t.getAttribute("data-value") === value);
    });
  }

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

  searchInput.addEventListener("input", function () {
    searchQuery = this.value.trim();
    render();
  });

  render();

})();
