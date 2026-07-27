/* 首页渲染：站点信息 + 按微信公众号发布时间排序的目录（不分年份） */
(function () {
  // 站点信息
  document.getElementById("site-title").textContent = SITE.title;
  document.getElementById("site-subtitle").textContent = SITE.subtitle;
  document.getElementById("hero-seal").textContent = SITE.title.charAt(0);
  document.title = SITE.title + " · 诗词集";
  document.getElementById("site-intro").innerHTML =
    SITE.intro.map(function (l) { return "<p>" + l + "</p>"; }).join("");
  document.getElementById("site-footer-text").textContent = SITE.footer;

  // 按微信公众号发布时间倒序
  var sorted = POEMS.slice().sort(function (a, b) {
    return b.date.localeCompare(a.date);
  });

  // 发布时间格式化为 YYYY.MM.DD
  function fmtDate(d) {
    if (!d) return "";
    var parts = d.split("-");
    if (parts.length < 2) return d;
    return parts[0] + "." + parts[1] + "." + (parts[2] || "");
  }

  // 扁平目录：按发布时间编次，不按年份分组
  var html = '<ul class="poem-list">';
  sorted.forEach(function (p) {
    html += '<li class="poem-item theme-' + p.theme + '">'
      + '<a href="poem.html?id=' + encodeURIComponent(p.id) + '">'
      + '<span class="poem-item-title">' + p.title + '</span>'
      + '<span class="poem-item-meta">'
      + '<em class="tag">' + p.genre + '</em>'
      + '<em class="poem-item-date">' + fmtDate(p.date) + '</em>'
      + '</span></a></li>';
  });
  html += '</ul>';

  document.getElementById("timeline").innerHTML =
    html || '<p class="empty-tip">诗稿整理中，敬请期待。</p>';
})();
