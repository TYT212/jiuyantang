/* 诗词详情页渲染：正文（含组诗）、配图、自言自语、田田说、前后导航、主题换肤 */
(function () {
  document.getElementById("nav-site").textContent = SITE.title;
  document.getElementById("site-footer-text").textContent = SITE.footer;

  var id = new URLSearchParams(location.search).get("id");
  var sorted = POEMS.slice().sort(function (a, b) {
    return b.date.localeCompare(a.date);
  });
  var idx = sorted.findIndex(function (p) { return p.id === id; });
  var page = document.getElementById("poem-page");

  if (idx === -1) {
    page.innerHTML = '<p class="empty-tip">未找到这首诗，请从<a href="index.html">目录</a>进入。</p>';
    return;
  }

  var p = sorted[idx];
  document.title = p.title + " · " + SITE.title;
  document.body.classList.add("theme-" + p.theme);

  // 微信公众号发布时间（备注用）
  function fmtPublish(d) {
    if (!d) return "";
    var parts = d.split("-");
    if (parts.length < 2) return d + "年";
    var m = parseInt(parts[1], 10);
    var day = parts[2] ? parseInt(parts[2], 10) : null;
    return parts[0] + "年" + m + "月" + (day ? day + "日" : "");
  }
  var publishText = fmtPublish(p.date);

  var html = "";

  // 题头
  html += '<header class="poem-head">';
  html += '<div class="poem-seal">' + (p.isGroup ? "组诗" : "诗") + '</div>';
  html += '<h1 class="poem-title">' + p.title + '</h1>';
  html += '<p class="poem-meta">' + (p.genre ? p.genre : '') + '</p>';
  html += '<p class="poem-remark">备注：发布于 ' + publishText + ' · 微信公众号「玖言堂」</p>';
  html += '</header>';

  // 配图（无图则显示水墨留白装饰）
  if (p.cover) {
    html += '<figure class="poem-cover"><img src="' + p.cover + '" alt="' + p.title + ' 配图"></figure>';
  } else {
    html += '<div class="poem-deco" aria-hidden="true"><span>❋</span></div>';
  }

  // 多段文本 → 段落
  function paras(text) {
    return text.split("\n").map(function (t) { return "<p>" + t + "</p>"; }).join("");
  }

  // 父亲自序（放正文前）
  if (p.note) {
    html += '<aside class="poem-note"><span class="note-label">自言自语</span><div class="note-body">' + paras(p.note) + '</div></aside>';
  }

  // 正文（单首或组诗）；组诗加 poem-body--group 以连贯通排
  html += '<article class="poem-body' + (p.isGroup ? ' poem-body--group' : '') + '">';
  p.poems.forEach(function (sub) {
    html += '<section class="poem-section">';
    if (sub.subtitle) {
      html += '<h2 class="poem-subtitle">' + sub.subtitle
        + (sub.genre ? ' <span class="sub-genre">' + sub.genre + '</span>' : '')
        + '</h2>';
    }
    html += '<div class="poem-lines">';
    sub.lines.forEach(function (line) {
      html += '<p>' + line + '</p>';
    });
    html += '</div>';
    if (sub.date) {
      html += '<p class="poem-sign">—— ' + sub.date + '</p>';
    }
    if (sub.note) {
      html += '<div class="poem-subnote">' + paras(sub.note) + '</div>';
    }
    if (sub.review) {
      html += '<div class="poem-review">'
        + '<div class="review-head">'
        + '<svg class="review-logo" viewBox="0 0 40 40" aria-hidden="true"><rect x="2" y="2" width="36" height="36" rx="7" fill="currentColor"/><text x="20" y="28" text-anchor="middle" font-family="Kaiti SC, STKaiti, serif" font-size="22" fill="#f6f1e4">评</text></svg>'
        + '<span class="review-author">' + sub.review.author + '评诗</span>'
        + '</div>'
        + '<div class="review-text">' + paras(sub.review.text) + '</div>'
        + '</div>';
    }
    html += '</section>';
  });
  html += '</article>';

  // 田田说（女儿点评）
  if (p.comment) {
    html += '<aside class="poem-comment">'
      + '<div class="comment-head"><span class="comment-seal">语</span><span class="comment-title">田田说</span></div>'
      + '<div class="comment-body">' + paras(p.comment) + '</div>'
      + '</aside>';
  }

  page.innerHTML = html;

  // 前后导航（sorted 为时间倒序：prev = 更新的一首，next = 更早的一首）
  var pager = "";
  if (idx > 0) {
    var prev = sorted[idx - 1];
    pager += '<a class="pager-link" href="poem.html?id=' + encodeURIComponent(prev.id) + '">« ' + prev.title + '</a>';
  } else {
    pager += '<span></span>';
  }
  if (idx < sorted.length - 1) {
    var next = sorted[idx + 1];
    pager += '<a class="pager-link" href="poem.html?id=' + encodeURIComponent(next.id) + '">' + next.title + ' »</a>';
  } else {
    pager += '<span></span>';
  }
  document.getElementById("pager").innerHTML = pager;
})();
