/* Улучшения поверх статичной страницы. Весь текст уже в HTML: без этого скрипта
   сайт читается целиком, просто без анимаций и раскрытия кейсов по одному. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* кейсы: открыт максимум один, панель под стопкой */
  var panels = $$(".case-panel"), current = null;
  function btns(id) { return $$('[data-case="' + id + '"]'); }
  function scrollTo(el) {
    /* resize: высота страницы только что изменилась, а Lenis помнит старую и не докрутит */
    if (window.__lenis) { window.__lenis.resize(); window.__lenis.scrollTo(el, { offset: -20 }); }
    else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
  function close(focusBack) {
    if (!current) return;
    var p = document.getElementById("case-" + current);
    p.classList.remove("is-open", "is-shown");
    btns(current).forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    var back = $('.sc [data-case="' + current + '"]');
    current = null;
    if (focusBack && back) back.focus({ preventScroll: true });
  }
  function open(id) {
    var p = document.getElementById("case-" + id);
    if (!p) return;
    if (current === id) return close(true);
    close(false);
    current = id;
    p.classList.add("is-shown");
    btns(id).forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
    requestAnimationFrame(function () { p.classList.add("is-open"); });
    var r = p.getBoundingClientRect();
    if (r.top < 0 || r.top > innerHeight * 0.6) scrollTo(p);
  }
  if (panels.length) {
    document.addEventListener("click", function (e) {
      var a = e.target.closest("[data-case]");
      /* stopPropagation: иначе Lenis (слушает window) прокрутит к еще скрытой панели */
      if (a) { e.preventDefault(); e.stopPropagation(); open(a.getAttribute("data-case")); return; }
      if (e.target.closest(".cd-close")) { close(true); return; }
      var sc = e.target.closest(".sc");
      if (sc && matchMedia("(min-width:761px)").matches) $("[data-case]", sc).click();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(true); });
    function fromHash() {
      var h = location.hash.match(/^#case-(.+)$/);
      if (h && h[1] !== current) open(h[1]);
    }
    addEventListener("hashchange", fromHash);
    fromHash();
  }

  /* кейсы-витрина (consulting): переключение без прокрутки страницы.
     showCase(id) вызывают и ссылки «примеры» из блока услуг */
  function jump(el, offset, instant) {
    if (window.__lenis) { window.__lenis.resize(); window.__lenis.scrollTo(el, { offset: offset, immediate: !!instant }); }
    else if (typeof el === "number") window.scrollTo(0, el);
    else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset, behavior: instant || reduce ? "auto" : "smooth" });
  }
  var showCase = null, narrow = function () { return matchMedia("(max-width:760px)").matches; };

  var cxa = $(".cx-a");
  if (cxa) {
    var tabs = $$(".cx-list [data-cx]", cxa), list = $(".cx-list", cxa);
    showCase = function (id, from) {
      var tab = $('.cx-list [data-cx="' + id + '"]', cxa), panel = document.getElementById("cx-" + id);
      if (!tab || !panel) return;
      tabs.forEach(function (t) { var on = t === tab; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; });
      $$(".cx-panel", cxa).forEach(function (p) { p.hidden = p !== panel; });
      if (narrow()) list.scrollTo({ left: tab.offsetLeft - 20, behavior: reduce ? "auto" : "smooth" });
      /* прокручиваем только если начало кейса ушло вверх или блок вообще не на экране */
      var top = panel.getBoundingClientRect().top, off = narrow() ? -70 : -20;
      if (from === "outside" || top < (narrow() ? 60 : 0) || top > innerHeight * .8) jump(from === "outside" && !narrow() ? $("#work") : panel, off);
      if (from === "key") tab.focus();
    };
    cxa.addEventListener("click", function (e) { var b = e.target.closest("[data-cx]"); if (b) showCase(b.dataset.cx, b.closest(".cx-nav") ? "nav" : "tab"); });
    list.addEventListener("keydown", function (e) {
      var i = tabs.indexOf(document.activeElement), d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (i < 0 || !d) return;
      e.preventDefault(); showCase(tabs[(i + d + tabs.length) % tabs.length].dataset.cx, "key");
    });
  }

  if (showCase) document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-case]");
    if (a) { e.preventDefault(); e.stopPropagation(); showCase(a.dataset.case, "outside"); }
  });

  /* появление: подчеркивания и счетчики */
  var marks = $$("u.mark"), counts = $$(".count");
  if (!("IntersectionObserver" in window) || reduce) {
    marks.forEach(function (m) { m.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var t = e.target; io.unobserve(t);
        if (t.tagName === "U") { t.classList.add("in"); return; }
        var to = parseFloat(t.dataset.to), from = parseFloat(t.dataset.from || 0), t0 = performance.now();
        (function tick(now) {
          var k = Math.min(1, (now - t0) / 1400), v = 1 - Math.pow(1 - k, 4);
          t.textContent = Math.round(from + (to - from) * v);
          if (k < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: .6 });
    marks.concat(counts).forEach(function (el) { io.observe(el); });
  }
  if (reduce) return;

  /* параллакс первого экрана, бегущая строка, стопка кейсов */
  var depth = $$("[data-depth]"), mq = $(".marquee .row"), pics = $$(".sc .th"), scs = $$(".sc"), ticking = false;
  function frame() {
    ticking = false;
    var y = scrollY, h = innerHeight;
    if (y < h * 1.4) depth.forEach(function (el) { el.style.translate = "0 " + (y * parseFloat(el.dataset.depth)).toFixed(1) + "px"; });
    if (mq) {
      var r = mq.getBoundingClientRect();
      if (r.bottom > 0 && r.top < h) mq.style.transform = "translate3d(" + (-(h - r.top) * 0.45).toFixed(1) + "px,0,0)";
    }
    var wide = innerWidth > 760;
    scs.forEach(function (sc, i) {
      var inn = sc.firstElementChild, nx = scs[i + 1];
      if (!wide || !nx) { inn.style.transform = ""; inn.style.filter = ""; return; }
      var gap = nx.getBoundingClientRect().top - sc.getBoundingClientRect().top, span = sc.offsetHeight;
      var k = Math.min(1, Math.max(0, 1 - (gap - 14) / span));
      inn.style.transform = "scale(" + (1 - k * .06).toFixed(4) + ")";
      inn.style.filter = "brightness(" + (1 - k * .35).toFixed(3) + ")";
    });
    pics.forEach(function (p) {
      var b = p.parentNode.getBoundingClientRect();
      if (b.bottom > 0 && b.top < h) p.style.translate = "0 " + (((b.top + b.height / 2) / h - .5) * -14).toFixed(1) + "px";
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  frame();

  /* инерционный скролл (Lenis лежит в assets/vendor) и магнитные кнопки */
  addEventListener("load", function () {
    if (window.Lenis) {
      var lenis = new Lenis({ lerp: .09, wheelMultiplier: 1, anchors: { offset: -10 } });
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
      window.__lenis = lenis;
    }
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    $$(".btn,.sc .more,.top .status,.cd-close").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transition = "transform .15s ease-out";
        el.style.transform = "translate(" + (dx * .22).toFixed(1) + "px," + (dy * .32).toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transition = "transform .6s cubic-bezier(.16,1,.3,1)";
        el.style.transform = "";
      });
    });
  });
})();
