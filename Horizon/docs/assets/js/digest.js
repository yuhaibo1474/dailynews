(function () {
  var content = document.querySelector('.main-content');
  var nav = document.querySelector('.digest-nav');
  if (!content || !nav) return;

  var h2s = Array.prototype.slice.call(content.querySelectorAll('h2'));
  if (h2s.length === 0) return;

  var isMobile = window.matchMedia('(max-width: 640px)').matches;

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

  function setActive(name) {
    tabs.forEach(function (t) {
      t.btn.classList.toggle('active', t.btn.getAttribute('data-panel') === name);
    });
  }

  if (isMobile) {
    // 移动端：所有板块纵向堆叠，Tab 只做锚点跳转。
    panels.forEach(function (p) { p.style.display = 'block'; });
    tabs.forEach(function (t) {
      t.btn.addEventListener('click', function () {
        t.panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActive(t.btn.getAttribute('data-panel'));
      });
    });
  } else {
    // 桌面端：Tab 切换显隐。
    tabs.forEach(function (t) {
      t.btn.addEventListener('click', function () {
        var name = t.btn.getAttribute('data-panel');
        panels.forEach(function (p) {
          p.style.display = (p.getAttribute('data-panel') === name) ? 'block' : 'none';
        });
        setActive(name);
      });
    });
    // 默认显示第一个板块。
    if (tabs.length) {
      panels.forEach(function (p) {
        p.style.display = (p === tabs[0].panel) ? 'block' : 'none';
      });
      setActive(tabs[0].btn.getAttribute('data-panel'));
    }
  }
})();
