/* Яндекс.Метрика с отказом по кнопке. Счётчик грузится у всех, кроме тех, кто нажал «Отказаться».
   Плашка висит, пока посетитель не выберет. Выбор хранится в localStorage ("ym-consent": "yes" или "no"). Номер счётчика берётся из data-ym у тега script.
   Кнопка с атрибутом data-consent-open (на странице политики) снова показывает плашку. */
(function () {
  var s = document.currentScript, id = s && s.getAttribute("data-ym"), KEY = "ym-consent", loaded = false;
  if (!id) return;

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function load() {
    if (loaded) return;
    loaded = true;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=" + id, "ym");
    window.ym(+id, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
  }

  /* после отказа убираем cookie Метрики, которые успели появиться на этом домене */
  function dropCookies() {
    var host = location.hostname, parts = host.split("."), domains = [host, "." + host];
    if (parts.length > 2) domains.push("." + parts.slice(-2).join("."));
    document.cookie.split(";").forEach(function (c) {
      var n = c.split("=")[0].trim();
      if (n.indexOf("_ym") !== 0 && n !== "yandexuid" && n !== "yuidss" && n !== "i") return;
      domains.forEach(function (d) { document.cookie = n + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=" + d; });
      document.cookie = n + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    });
  }

  function close() { var b = document.getElementById("consent"); if (b) b.remove(); }

  function choose(v) {
    set(v);
    close();
    if (v === "yes") load();
    else { dropCookies(); if (loaded) location.reload(); }
  }

  function banner() {
    if (document.getElementById("consent")) return;
    var d = document.createElement("div");
    d.id = "consent";
    d.className = "consent";
    d.setAttribute("role", "dialog");
    d.setAttribute("aria-label", "Уведомление о cookie");
    d.innerHTML = '<p>Сайт использует Яндекс.Метрику: она ставит cookie и собирает статистику посещений. ' +
      'Подробности и как отказаться — в <a href="/privacy/">политике конфиденциальности</a>.</p>' +
      '<div class="acts"><button type="button" class="btn" data-v="yes">Понятно</button>' +
      '<button type="button" class="btn ghost" data-v="no">Отказаться</button></div>';
    d.addEventListener("click", function (e) {
      var v = e.target.closest && e.target.closest("[data-v]");
      if (v) choose(v.getAttribute("data-v"));
    });
    document.body.appendChild(d);
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("[data-consent-open]")) banner();
  });

  var saved = get();
  if (saved !== "no") load();
  if (saved !== "yes" && saved !== "no") banner();
})();
