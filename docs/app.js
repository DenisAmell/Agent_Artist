// Рендер выставки из window.GALLERY (файл data/gallery.js создаёт Agent_Artist.ipynb)
(function () {
  const G = window.GALLERY;
  const $ = (sel, root = document) => root.querySelector(sel);

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Мини-markdown для реплик агентов: **жирный**, *курсив*, цитаты "> " и переносы строк
  const md = (s) => esc(s)
    .replace(/^&gt; ?/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.+?)\*/g, "<i>$1</i>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>");

  const SPEAKERS = [
    ["Художник", "artist"], ["Промпт-инженер", "engineer"], ["Генератор", "image"],
    ["критик", "critic"], ["Судья", "judge"], ["Куратор", "curator"],
  ];
  const speakerClass = (name) => (SPEAKERS.find(([k]) => name.includes(k)) || [, "other"])[1];

  if (!G || !G.works || !G.works.length) {
    $("#works").innerHTML = `<div class="empty"><h2>Галерея ещё не сгенерирована</h2>
      <p>Запустите <code>Agent_Artist.ipynb</code> — он сохранит картины в <code>docs/images</code>,
      а диалоги и оценки — в <code>docs/data/gallery.js</code>.</p></div>`;
    return;
  }

  $("#intro").textContent = G.intro || "";
  const models = G.models || {};
  for (const role of ["artist", "engineer", "critic", "judge", "curator"]) {
    if (models[role]) $("#m-" + role).textContent = models[role];
  }
  if (G.image_model) $("#m-image").textContent = G.image_model;
  if (G.target_score) $("#target").textContent = G.target_score;
  if (G.max_iterations) $("#maxit").textContent = G.max_iterations;

  const scoreBar = (w) => {
    const target = G.target_score || 8;
    return `<div class="scores" aria-label="Баллы судьи по версиям">` + w.iterations.map((x, i) => {
      const s = x.judge.score;
      return `<button class="score ${i === w.best ? "is-best" : ""} ${s >= target ? "is-hit" : ""}" data-v="${i}"
        title="Версия ${x.n}: ${s}/10">
        <span class="bar"><span style="height:${s * 10}%"></span></span>
        <span class="lbl">v${x.n}</span><span class="val">${s}</span></button>`;
    }).join(`<span class="arrow">→</span>`) + `</div>`;
  };

  const versionInfo = (w, i) => {
    const x = w.iterations[i];
    return `<p class="vtitle">Версия ${x.n}${i === w.best ? " · выбрана куратором" : ""} — <b>${x.judge.score}/10</b></p>
      <dl>
        <dt>👁 Зритель решил, что картина о том, что</dt><dd>${esc(x.critic.feeling)}</dd>
        <dt>⚖️ Потеряно</dt><dd>${esc(x.judge.missing)}</dd>
        <dt>🛠 Промпт</dt><dd class="prompt">${esc(x.prompt)}</dd>
      </dl>`;
  };

  const dialogue = (w) => {
    let html = "", it = -1;
    for (const line of w.dialogue) {
      if (line.iteration !== it && !line.speaker.includes("Куратор")) {
        it = line.iteration;
        html += `<h4 class="round">Версия ${it + 1}</h4>`;
      }
      if (line.speaker.includes("Куратор")) html += `<h4 class="round">Итог</h4>`;
      const cls = speakerClass(line.speaker);
      const isPrompt = line.text.startsWith("PROMPT:");
      html += `<div class="msg ${cls} ${isPrompt ? "is-prompt" : ""}">
        <div class="who">${esc(line.speaker)}</div><div class="text"><p>${md(line.text)}</p></div></div>`;
      if (cls === "critic") {
        const x = w.iterations[line.iteration];
        if (x) html += `<img class="inline-img" src="${esc(x.image)}" alt="Версия ${x.n}" loading="lazy">`;
      }
    }
    return html;
  };

  const works = $("#works");
  G.works.forEach((w, idx) => {
    const best = w.iterations[w.best];
    const el = document.createElement("article");
    el.className = "work";
    el.id = w.slug;
    el.innerHTML = `
      <div class="piece">
      <div class="frame">
        <img class="main" src="${esc(best.image)}" alt="${esc(w.title)}">
        <div class="thumbs">${w.iterations.map((x, i) => `
          <button class="thumb ${i === w.best ? "is-active" : ""}" data-v="${i}" aria-label="Версия ${x.n}">
            <img src="${esc(x.image)}" alt="" loading="lazy"><span>v${x.n} · ${x.judge.score}</span></button>`).join("")}
        </div>
      </div>
      <div class="plate">
        <p class="num">№ ${idx + 1} · ${esc(w.lang)}</p>
        <h2 class="word">${esc(w.word)}</h2>
        <h3 class="title">«${esc(w.title)}»</h3>
        <p class="label">${esc(w.label)}</p>
        <p class="meaning"><b>Значение слова.</b> ${esc(w.meaning)}</p>
        ${scoreBar(w)}
        <div class="version">${versionInfo(w, w.best)}</div>
      </div>
      </div>
      <details class="dialogue">
        <summary>Диалог агентов · ${w.dialogue.length} реплик</summary>
        <div class="chat">${dialogue(w)}</div>
      </details>`;
    works.appendChild(el);

    const select = (i) => {
      $(".main", el).src = w.iterations[i].image;
      $(".version", el).innerHTML = versionInfo(w, i);
      el.querySelectorAll("[data-v]").forEach((b) => b.classList.toggle("is-active", +b.dataset.v === i));
    };
    el.querySelectorAll("[data-v]").forEach((b) => b.addEventListener("click", () => select(+b.dataset.v)));
  });

  // Лайтбокс: клик по любой картине открывает её крупно
  const lb = $("#lightbox");
  document.addEventListener("click", (e) => {
    if (e.target.matches(".main, .inline-img")) {
      $("img", lb).src = e.target.src;
      lb.hidden = false;
    } else if (e.target.closest("#lightbox")) {
      lb.hidden = true;
    }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") lb.hidden = true; });

  const when = G.generated_at ? new Date(G.generated_at).toLocaleString("ru-RU") : "";
  $("#footer").innerHTML = `Сгенерировано ${esc(when)} · текст: ${esc([...new Set(Object.values(models))].join(", "))}
    · изображения: ${esc(G.image_model)} · код: Agent_Artist.ipynb`;
})();
