(() => {
  "use strict";
  const COLORS = ["#4361ee", "#10a7a1", "#f59e0b", "#8b5cf6", "#e85d75", "#2d9cdb", "#64748b", "#e879a9"];
  const DEFAULT_JOBS = [
    { id: 1, batch: 200, arrival: 1 },
    { id: 2, batch: 400, arrival: 8 },
    { id: 3, batch: 100, arrival: 14 },
    { id: 4, batch: 200, arrival: 18 }
  ];
  const $ = (id) => document.getElementById(id);
  let jobs = [];
  let simulation = null;
  let currentDay = 0;
  let playTimer = null;

  function durationA(batch) { return Math.floor(batch / 50) + 1; }
  function durationB(batch) { return Math.floor(batch / 100) + 3; }
  function cloneDefaults() { return DEFAULT_JOBS.map(j => ({ ...j })); }

  // Simülasyon, tam gün aralıklarını [başlangıç, bitiş) biçiminde ele alır.
  // Makine bir günün başında boşsa ve hazır işi varsa işe başlar.
  // A'da tamamlanan işler, aynı günün sonunda B kuyruğuna eklenir;
  // B işi bir sonraki gün başlatabilir. Bu, zaman dilimleme varsayımıdır.
  function buildSimulation(inputJobs) {
    const sorted = inputJobs.map(j => ({
      ...j, aTime: durationA(j.batch), bTime: durationB(j.batch),
      aStart: null, aEnd: null, bStart: null, bEnd: null,
      waitA: 0, waitB: 0
    })).sort((a, b) => a.arrival - b.arrival || a.id - b.id);

    const maxArrival = Math.max(...sorted.map(j => j.arrival));
    const maxWork = sorted.reduce((s, j) => s + j.aTime + j.bTime, 0);
    const maxDay = maxArrival + maxWork + sorted.length + 5;
    const aQueue = [], bQueue = [], states = [];
    let activeA = null, activeB = null, done = 0;
    let aRemaining = 0, bRemaining = 0;
    const allJobs = new Map(sorted.map(j => [j.id, j]));

    for (let day = 1; day <= maxDay; day++) {
      const arrivalsToday = sorted.filter(j => j.arrival === day);
      arrivalsToday.forEach(j => aQueue.push(j));

      if (!activeA && aQueue.length) {
        activeA = aQueue.shift();
        activeA.aStart = day;
        activeA.waitA = day - activeA.arrival;
        aRemaining = activeA.aTime;
      }
      if (!activeB && bQueue.length) {
        activeB = bQueue.shift();
        activeB.bStart = day;
        activeB.waitB = day - activeB.aEnd;
        bRemaining = activeB.bTime;
      }

      const workingA = activeA ? activeA.id : null;
      const workingB = activeB ? activeB.id : null;
      const aQueueIds = aQueue.map(j => j.id);
      const bQueueIds = bQueue.map(j => j.id);

      // Bu günün işlem süresi tamamlanınca gün sonunda durum değişir.
      if (activeA) {
        aRemaining -= 1;
        if (aRemaining === 0) {
          activeA.aEnd = day + 1;
          bQueue.push(activeA);
          activeA = null;
        }
      }
      if (activeB) {
        bRemaining -= 1;
        if (bRemaining === 0) {
          activeB.bEnd = day + 1;
          done += 1;
          activeB = null;
        }
      }

      states.push({
        day, arrivals: arrivalsToday.map(j => j.id), aQueue: aQueueIds, bQueue: bQueueIds,
        workingA, workingB, done,
        // activeAtStart is the work assigned to the whole [day, day+1) interval.
        aActive: workingA, bActive: workingB
      });
      if (done === sorted.length) break;
    }

    const finalDay = states.length ? states[states.length - 1].day : 0;
    return { jobs: [...allJobs.values()].sort((a, b) => a.id - b.id), states, finalDay };
  }

  function renderEditor() {
    $("jobsEditor").innerHTML = jobs.map(j => `
      <tr>
        <td><span class="job-chip" style="background:${COLORS[(j.id - 1) % COLORS.length]}">${j.id}</span></td>
        <td><input aria-label="${j.id}. iş yığın büyüklüğü" type="number" min="1" max="100000" step="1" data-job="${j.id}" data-field="batch" value="${j.batch}"></td>
        <td><input aria-label="${j.id}. iş geliş günü" type="number" min="1" max="10000" step="1" data-job="${j.id}" data-field="arrival" value="${j.arrival}"></td>
        <td>${durationA(j.batch)}</td><td>${durationB(j.batch)}</td>
      </tr>`).join("");
  }

  function getState(day) {
    if (!simulation || day < 1) return null;
    return simulation.states.find(s => s.day === day) || simulation.states[simulation.states.length - 1] || null;
  }
  function jobById(id) { return simulation.jobs.find(j => j.id === id); }
  function idText(ids) { return ids && ids.length ? ids.map(n => `İş ${n}`).join(", ") : "—"; }
  function fmtRange(start, end) { return start == null || end == null ? "—" : `${start}. gün – ${end - 1}. gün`; }

  function renderLegend() {
    $("jobLegend").innerHTML = simulation.jobs.map(j => `<span class="legend-item"><i class="legend-dot" style="background:${COLORS[(j.id-1)%COLORS.length]}"></i>İş ${j.id}</span>`).join("");
  }

  function renderGantt() {
    const maxDay = Math.max(1, simulation.finalDay);
    const area = $("ganttArea");
    area.innerHTML = "";
    ["A", "B"].forEach(machine => {
      const row = document.createElement("div");
      row.className = "gantt-row";
      row.style.setProperty("--days", maxDay);
      for (let d = 0; d < maxDay; d++) {
        const cell = document.createElement("div");
        cell.className = "gantt-cell";
        row.appendChild(cell);
      }
      simulation.jobs.forEach(j => {
        const start = machine === "A" ? j.aStart : j.bStart;
        const end = machine === "A" ? j.aEnd : j.bEnd;
        if (start == null || end == null) return;
        const block = document.createElement("div");
        block.className = "gantt-block";
        block.dataset.job = j.id;
        block.dataset.machine = machine;
        block.style.left = `${((start - 1) / maxDay) * 100}%`;
        block.style.width = `${((end - start) / maxDay) * 100}%`;
        block.style.background = COLORS[(j.id - 1) % COLORS.length];
        block.textContent = `İ${j.id}`;
        block.title = `İş ${j.id} · Makine ${machine} · ${start}. gün ile ${end}. gün arası`;
        row.appendChild(block);
      });
      const marker = document.createElement("div");
      marker.className = "gantt-day-marker";
      marker.dataset.marker = "true";
      row.appendChild(marker);
      area.appendChild(row);
    });
    $("rangeEnd").textContent = `Gün ${maxDay}`;
    $("daySlider").max = String(maxDay);
  }

  function renderResults() {
    $("resultsBody").innerHTML = simulation.jobs.map(j => `
      <tr><td><span class="job-chip" style="background:${COLORS[(j.id-1)%COLORS.length]}">${j.id}</span></td>
      <td>${j.arrival}</td><td>${fmtRange(j.aStart,j.aEnd)}</td><td>${fmtRange(j.bStart,j.bEnd)}</td>
      <td>${j.waitA} gün</td><td>${j.waitB} gün</td><td>${j.bEnd == null ? "—" : `${j.bEnd - 1}. gün`}</td></tr>`).join("");
    const last = Math.max(...simulation.jobs.map(j => j.bEnd == null ? 0 : j.bEnd - 1));
    const aBusy = simulation.jobs.reduce((sum, j) => sum + j.aTime, 0);
    const bBusy = simulation.jobs.reduce((sum, j) => sum + j.bTime, 0);
    const aWait = simulation.jobs.reduce((sum, j) => sum + j.waitA, 0);
    const bWait = simulation.jobs.reduce((sum, j) => sum + j.waitB, 0);
    $("completionBadge").textContent = `Son iş: ${last}. gün`;
    $("resultsSummary").innerHTML = `
      <div class="summary-item"><span>Tüm işlerin tamamlanması</span><strong>${last}. gün</strong></div>
      <div class="summary-item"><span>A makinesi işlem süresi toplamı</span><strong>${aBusy} gün</strong><span>Kullanım oranı yaklaşık %${last ? (100*aBusy/last).toFixed(1) : "0.0"}</span></div>
      <div class="summary-item"><span>Toplam kuyruk bekleme</span><strong>${aWait+bWait} gün</strong><span>A: ${aWait} gün · B: ${bWait} gün</span></div>`;
  }

  function renderDay() {
    const day = currentDay;
    const state = getState(day);
    $("metricDay").textContent = day;
    $("timelineDayBadge").textContent = `Gün ${day}`;
    $("sliderLabel").textContent = `Gün ${day}`;
    $("daySlider").value = String(day);
    $("runStatus").textContent = day === 0 ? "Hazır · Gün 0" : (day >= simulation.finalDay ? `Tamamlandı · Gün ${day}` : `Çalışıyor · Gün ${day}`);
    $("metricDone").textContent = `${state ? state.done : 0} / ${simulation.jobs.length}`;
    const aJob = state && state.aActive ? jobById(state.aActive) : null;
    const bJob = state && state.bActive ? jobById(state.bActive) : null;
    $("metricA").textContent = aJob ? `İş ${aJob.id}` : "Boş";
    $("metricAHelp").textContent = aJob ? `${aJob.aTime} günlük işlem · başlangıç ${aJob.aStart}` : "Şu anda işlem yok";
    $("metricB").textContent = bJob ? `İş ${bJob.id}` : "Boş";
    $("metricBHelp").textContent = bJob ? `${bJob.bTime} günlük işlem · başlangıç ${bJob.bStart}` : "Şu anda işlem yok";
    $("heroAState").textContent = aJob ? `İş ${aJob.id}` : "Hazır";
    $("heroBState").textContent = bJob ? `İş ${bJob.id}` : "Hazır";

    document.querySelectorAll(".gantt-block").forEach(block => {
      const j = jobById(Number(block.dataset.job));
      const isA = block.dataset.machine === "A";
      const start = j ? (isA ? j.aStart : j.bStart) : null;
      const end = j ? (isA ? j.aEnd : j.bEnd) : null;
      block.classList.toggle("current", start != null && day >= start && day < end);
    });
    document.querySelectorAll("[data-marker='true']").forEach(marker => {
      const maxDay = simulation.finalDay;
      marker.style.left = `${Math.min(100, Math.max(0, (day / maxDay) * 100))}%`;
    });
    $("timelineHint").textContent = day === 0 ? "Gün 0: henüz işleme başlamadı." : state ? `Gün ${day}: A'da ${aJob ? "İş " + aJob.id : "boş"}, B'de ${bJob ? "İş " + bJob.id : "boş"}.` : "Simülasyon sona erdi.";
    if (!state) {
      $("dayExplanation").innerHTML = "<strong>Başlangıç durumu:</strong> Simülasyon henüz başlatılmadı. Bir gün ileri tuşuna bas veya Başlat'ı seç.";
      $("eventLog").innerHTML = `<div class="event-item"><span class="event-bullet">1</span><p><b>Gelişler:</b> İlk işler belirtilen geliş günlerinde A kuyruğuna gelir.</p></div><div class="event-item"><span class="event-bullet">2</span><p><b>İşlem:</b> İşler önce A, sonra B makinesinden geçer.</p></div>`;
    } else {
      const arrivals = state.arrivals.length ? `Bugün gelen: ${idText(state.arrivals)}.` : "Bugün yeni iş gelişi yok.";
      $("dayExplanation").innerHTML = `<strong>Gün ${day}:</strong> ${arrivals} A makinesi ${aJob ? `İş ${aJob.id}'i` : "boş durumu"}; B makinesi ${bJob ? `İş ${bJob.id}'i` : "boş durumu"} üzerinde.`;
      const events = [];
      if (state.arrivals.length) events.push(`<div class="event-item"><span class="event-bullet">↘</span><p><b>Yeni geliş:</b> ${idText(state.arrivals)} A kuyruğuna katıldı.</p></div>`);
      events.push(`<div class="event-item"><span class="event-bullet">A</span><p><b>A makinesi:</b> ${aJob ? `İş ${aJob.id} işlem görüyor.` : "Bu gün işlem yapmıyor."}</p></div>`);
      events.push(`<div class="event-item"><span class="event-bullet">B</span><p><b>B makinesi:</b> ${bJob ? `İş ${bJob.id} işlem görüyor.` : "Bu gün işlem yapmıyor."}</p></div>`);
      if (state.done) events.push(`<div class="event-item"><span class="event-bullet">✓</span><p><b>Tamamlanan:</b> Şimdiye kadar ${state.done} iş iki makineyi de bitirdi.</p></div>`);
      $("eventLog").innerHTML = events.join("");
    }

    // Günlük tablo: seçili gün ve yakınındaki günler, simülasyonun gerçek durumlarından gösterilir.
    const start = Math.max(1, Math.min(day || 1, Math.max(1, simulation.states.length)) - 2);
    const end = Math.min(simulation.states.length, start + 5);
    $("stateTableBody").innerHTML = simulation.states.filter(s => s.day >= start && s.day <= end).map(s => {
      const qA = s.aQueue.filter(id => id !== s.workingA);
      return `<tr class="${s.day === day ? "selected-row" : ""}"><td>${s.day}</td><td>${idText(s.aQueue)}</td><td>${idText(s.bQueue)}</td><td>${s.workingA == null ? "—" : `İş ${s.workingA}`}</td><td>${s.workingB == null ? "—" : `İş ${s.workingB}`}</td></tr>`;
    }).join("") || `<tr><td colspan="5">Henüz gün kaydı yok.</td></tr>`;
  }

  function renderAll() {
    renderLegend(); renderGantt(); renderResults(); renderDay();
  }

  function stopPlaying() {
    if (playTimer) window.clearInterval(playTimer);
    playTimer = null;
    $("playBtn").textContent = "▶ Başlat";
  }
  function setDay(day) {
    currentDay = Math.max(0, Math.min(Number(day) || 0, simulation.finalDay));
    renderDay();
  }
  function stepForward() {
    if (currentDay >= simulation.finalDay) { stopPlaying(); return; }
    setDay(currentDay + 1);
    if (currentDay >= simulation.finalDay) stopPlaying();
  }
  function startPlaying() {
    if (playTimer) { stopPlaying(); return; }
    if (currentDay >= simulation.finalDay) setDay(0);
    $("playBtn").textContent = "Ⅱ Duraklat";
    playTimer = window.setInterval(stepForward, Number($("speedSelect").value));
  }

  function validateAndRead() {
    const inputs = [...document.querySelectorAll("#jobsEditor input")];
    const changed = new Map(jobs.map(j => [j.id, { ...j }]));
    for (const input of inputs) {
      const id = Number(input.dataset.job);
      const value = Number(input.value);
      if (!Number.isInteger(value) || value < Number(input.min) || value > Number(input.max)) {
        throw new Error(`İş ${id} için ${input.dataset.field === "batch" ? "yığın" : "geliş günü"} geçerli bir tam sayı olmalı (${input.min}–${input.max}).`);
      }
      changed.get(id)[input.dataset.field] = value;
    }
    const result = [...changed.values()];
    if (new Set(result.map(j => j.arrival)).size !== result.length) {
      // Aynı gün birden fazla geliş desteklenir; bu nedenle bu bir hata değildir.
    }
    return result;
  }

  function applyNewJobs(nextJobs) {
    stopPlaying();
    jobs = nextJobs;
    simulation = buildSimulation(jobs);
    currentDay = 0;
    $("validationMessage").textContent = "";
    renderEditor();
    renderAll();
  }

  function downloadCsv() {
    const rows = [
      ["İş", "Yığın", "Geliş günü", "A süresi", "B süresi", "A başlangıç", "A bitiş", "B başlangıç", "B bitiş", "A bekleme", "B bekleme", "Tamamlanma"]
    ];
    simulation.jobs.forEach(j => rows.push([j.id, j.batch, j.arrival, j.aTime, j.bTime, j.aStart, j.aEnd, j.bStart, j.bEnd, j.waitA, j.waitB, j.bEnd]));
    const csv = "\uFEFF" + rows.map(row => row.map(value => `"${value == null ? "" : String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "atolye-simulasyon-sonuclari.csv";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  document.querySelectorAll(".tab").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b === button));
    ["simulator", "concepts", "exam"].forEach(name => $(`${name}Panel`).classList.toggle("hidden", name !== button.dataset.tab));
  }));
  $("applyJobs").addEventListener("click", () => {
    try { applyNewJobs(validateAndRead()); }
    catch (error) { $("validationMessage").textContent = error.message; }
  });
  $("resetDefaults").addEventListener("click", () => applyNewJobs(cloneDefaults()));
  $("backBtn").addEventListener("click", () => { stopPlaying(); setDay(currentDay - 1); });
  $("nextBtn").addEventListener("click", () => { stopPlaying(); stepForward(); });
  $("finishBtn").addEventListener("click", () => { stopPlaying(); setDay(simulation.finalDay); });
  $("daySlider").addEventListener("input", event => { stopPlaying(); setDay(event.target.value); });
  $("playBtn").addEventListener("click", startPlaying);
  $("speedSelect").addEventListener("change", () => {
    if (playTimer) { stopPlaying(); startPlaying(); }
  });
  $("downloadCsv").addEventListener("click", downloadCsv);
  $("footerStart").addEventListener("click", () => {
    document.querySelector('[data-tab="simulator"]').click();
    $("simulatorPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const answers = { q1: "b", q2: "c", q3: "a", q4: "b" };
  $("quizForm").addEventListener("submit", event => {
    event.preventDefault();
    let score = 0;
    Object.entries(answers).forEach(([name, answer]) => {
      const chosen = document.querySelector(`input[name="${name}"]:checked`);
      const fieldset = document.querySelector(`input[name="${name}"]`).closest("fieldset");
      fieldset.querySelectorAll("label").forEach(label => {
        label.classList.remove("correct", "wrong");
        const input = label.querySelector("input");
        if (input.value === answer) label.classList.add("correct");
        if (chosen && input === chosen && input.value !== answer) label.classList.add("wrong");
      });
      if (chosen && chosen.value === answer) score++;
    });
    $("quizResult").textContent = `${score}/4 doğru. ${score === 4 ? "Harika, hepsi doğru!" : "Yeşil seçenekler doğru cevaptır; tekrar deneyebilirsin."}`;
    $("quizResult").style.color = score === 4 ? "#138567" : "#52627a";
  });
  $("resetQuiz").addEventListener("click", () => {
    $("quizForm").reset();
    document.querySelectorAll(".quiz-question label").forEach(label => label.classList.remove("correct", "wrong"));
    $("quizResult").textContent = "";
  });

  applyNewJobs(cloneDefaults());
})();