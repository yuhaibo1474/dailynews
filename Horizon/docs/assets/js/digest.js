(function () {
  var content = document.querySelector('.main-content');
  var nav = document.querySelector('.digest-nav');
  if (!content || !nav) return;

  var h2s = Array.prototype.slice.call(content.querySelectorAll('h2'));
  if (h2s.length === 0) return;

  // 1) 把每个 <h2> 及其后续内容包成一个 panel（直到下一个 <h2>）。
  h2s.forEach(function (h2, i) {
    var panel = document.createElement('section');
    panel.className = 'digest-panel';
    panel.setAttribute('data-panel', h2.textContent.trim());
    panel.id = 'digest-panel-' + i;
    h2.parentNode.insertBefore(panel, h2);

    var node = h2;
    while (node) {
      var next = node.nextSibling;
      if (node.nodeType === 1 && node.tagName === 'H2' && node !== h2) break;
      panel.appendChild(node);
      node = next;
    }
  });

  var panels = Array.prototype.slice.call(content.querySelectorAll('.digest-panel'));

  // 2) 隐藏顶部目录区（<strong>+<ol>）和分隔线，只保留导语 blockquote 与各 panel。
  Array.prototype.slice.call(content.children).forEach(function (child) {
    if (child.classList && child.classList.contains('digest-panel')) return;
    if (child.tagName === 'BLOCKQUOTE') return;
    child.style.display = 'none';
  });

  // 3) 依据 panel 名称生成顶部导航标签。
  var tabs = [];
  panels.forEach(function (panel) {
    var name = panel.getAttribute('data-panel');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'digest-tab';
    btn.textContent = name;
    btn.setAttribute('data-panel', name);
    nav.appendChild(btn);
    tabs.push({ btn: btn, panel: panel });
  });

  // 4) 每个板块内的新闻条目包裹成卡片（1×n 单列列表）。
  panels.forEach(function (panel) { cardify(panel); });

  function cardify(panel) {
    var cards = [];
    var current = [];
    Array.prototype.slice.call(panel.children).forEach(function (child) {
      // 板块标题 <h2> 跳过，不放进卡片。
      if (child.tagName === 'H2') return;
      // 条目锚点 <p><a id="item-..."></a></p>：条目起点，锚点本身是空的，移除。
      if (child.tagName === 'P' && child.querySelector('a[id^="item-"]')) {
        if (current.length) cards.push(current);
        current = [];
        child.remove();
        return;
      }
      // 分隔线 <hr>：条目终点，移除。
      if (child.tagName === 'HR') {
        if (current.length) cards.push(current);
        current = [];
        child.remove();
        return;
      }
      current.push(child);
    });
    if (current.length) cards.push(current);

    cards.forEach(function (group) {
      var card = document.createElement('div');
      card.className = 'card';
      var first = group[0];
      first.parentNode.insertBefore(card, first);
      group.forEach(function (n) { card.appendChild(n); });
    });
  }

  // 5) 顶部导航：点击切换到对应板块。
  function activate(name) {
    panels.forEach(function (p) {
      p.style.display = (p.getAttribute('data-panel') === name) ? 'block' : 'none';
    });
    tabs.forEach(function (t) {
      t.btn.classList.toggle('active', t.btn.getAttribute('data-panel') === name);
    });
  }

  tabs.forEach(function (t) {
    t.btn.addEventListener('click', function () {
      activate(t.btn.getAttribute('data-panel'));
    });
  });

  // 默认显示第一个板块。
  if (tabs.length) activate(tabs[0].btn.getAttribute('data-panel'));
})();
