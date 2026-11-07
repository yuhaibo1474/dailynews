(function () {
  var content = document.querySelector('.main-content');
  var nav = document.querySelector('.digest-nav');
  if (!content || !nav) return;

  var h2s = Array.prototype.slice.call(content.querySelectorAll('h2'));
  if (h2s.length === 0) return;

  // 1) 把每个 <h2> 及其后续内容包成一个 panel（直到下一个 <h2>）。
  h2s.forEach(function (h2) {
    var panel = document.createElement('section');
    panel.className = 'digest-panel';
    panel.setAttribute('data-panel', h2.textContent.trim());
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
  var names = panels.map(function (p) { return p.getAttribute('data-panel'); });
  panels.forEach(function (panel) {
    var name = panel.getAttribute('data-panel');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'digest-tab';
    btn.textContent = name;
    btn.setAttribute('data-panel', name);
    btn.addEventListener('click', function () { activate(name); });
    nav.appendChild(btn);
  });

  function activate(name) {
    panels.forEach(function (p) {
      p.style.display = (p.getAttribute('data-panel') === name) ? 'block' : 'none';
    });
    Array.prototype.slice.call(nav.querySelectorAll('.digest-tab')).forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-panel') === name);
    });
  }

  // 默认显示第一个板块（AI资讯）。
  activate(names[0]);
})();
