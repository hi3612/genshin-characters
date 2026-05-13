(function () {
  "use strict";

  const grid = document.getElementById("character-grid");
  const modalOverlay = document.getElementById("modal-overlay");
  const modalContent = document.getElementById("modal-content");
  const modalClose = document.getElementById("modal-close");
  const searchInput = document.getElementById("search-input");
  const resultCount = document.getElementById("result-count");

  const elementTags = document.querySelectorAll("#element-filters .tag");
  const regionTags = document.querySelectorAll("#region-filters .tag");

  // 当前筛选状态
  let activeElement = "all";
  let activeRegion = "all";
  let searchQuery = "";

  // 元素中文到 CSS class 后缀的映射
  const elementClassMap = {
    "火": "pyro",
    "水": "hydro",
    "风": "anemo",
    "雷": "electro",
    "冰": "cryo",
    "草": "dendro",
    "岩": "geo",
    "无": "none"
  };

  // ---- 渲染一张角色卡片 ----
  function createCard(char) {
    const elemClass = elementClassMap[char.element] || "none";
    const stars = char.rarity === 5 ? "★★★★★" : "★★★★";

    const div = document.createElement("div");
    div.className = "card";
    div.setAttribute("data-id", char.id);
    div.innerHTML =
      '<div class="card-header">' +
        '<div class="card-icon ' + elemClass + '">' + char.name[0] + '</div>' +
        '<div class="card-name">' + char.name + '</div>' +
        '<div class="card-title">' + char.title + '</div>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-meta">' +
          '<span>' + char.element + '</span>' +
          '<span>' + char.region + '</span>' +
          '<span>' + char.weapon + '</span>' +
        '</div>' +
        '<div class="rarity-stars">' + stars + '</div>' +
      '</div>';

    div.addEventListener("click", function () {
      openModal(char);
    });

    return div;
  }

  // ---- 打开详情弹窗 ----
  function openModal(char) {
    const elemClass = elementClassMap[char.element] || "none";
    const stars = char.rarity === 5 ? "★★★★★" : "★★★★";

    var specialtiesHtml = char.specialties.map(function (s) {
      return "<li>" + s + "</li>";
    }).join("");

    modalContent.innerHTML =
      '<div class="detail-header">' +
        '<div class="detail-icon ' + elemClass + '">' + char.name[0] + '</div>' +
        '<div>' +
          '<div class="detail-name">' + char.name + '</div>' +
          '<div class="detail-title">' + char.title + '</div>' +
          '<div class="detail-meta">' +
            '<span>' + stars + '</span>' +
            '<span>' + char.element + '</span>' +
            '<span>' + char.region + '</span>' +
            '<span>' + char.weapon + '</span>' +
          '</div>' +
        '</div>' +
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
      '</div>';

    modalOverlay.classList.add("show");
    document.body.style.overflow = "hidden";
    modalOverlay.querySelector(".modal").scrollTop = 0;
  }

  // ---- 关闭弹窗 ----
  function closeModal() {
    modalOverlay.classList.remove("show");
    document.body.style.overflow = "";
  }

  modalClose.addEventListener("click", closeModal);

  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modalOverlay.classList.contains("show")) {
      closeModal();
    }
  });

  // ---- 判断角色是否符合当前筛选 ----
  function matches(char) {
    if (activeElement !== "all" && char.element !== activeElement) return false;
    if (activeRegion !== "all" && char.region !== activeRegion) return false;
    if (searchQuery && char.name.indexOf(searchQuery) === -1) return false;
    return true;
  }

  // ---- 渲染角色网格 ----
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
      noDiv.innerHTML = '<div class="no-icon">✦</div><p>没有找到匹配的角色</p>';
      grid.appendChild(noDiv);
    } else {
      for (var j = 0; j < filtered.length; j++) {
        grid.appendChild(createCard(filtered[j]));
      }
    }

    resultCount.textContent = "共 " + filtered.length + " 位角色";
  }

  // ---- 设置标签激活状态 ----
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

  searchInput.addEventListener("input", function () {
    searchQuery = this.value.trim();
    render();
  });

  // ---- 初始渲染 ----
  render();

})();
