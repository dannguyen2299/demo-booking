// LÕI: dữ liệu, lịch trống, thành phần dùng chung, trang chủ, "Lịch của tôi", bảng chọn mẫu.
// Các luồng đặt lịch nằm trong flows.js và dùng lại các thành phần ở đây qua window.BK.
(() => {
  const C = window.CONFIG;
  C.services = []; C.brand = {}; C.staff = []; C.staffLabel = "Chuyên viên";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = "booking-demo-v2";
  const DOW = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
  const DOW_S = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  /* ---------- helpers ---------- */
  const pad = n => String(n).padStart(2, "0");
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const money = n => n ? n.toLocaleString("vi-VN") + "đ" : "Miễn phí";
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const svc = id => C.services.find(s => s.id === id) || C.services[0];
  const staffOf = id => C.staff.find(s => s.id === id) || null;
  const fmtDate = s => { const d = parse(s); return `${DOW[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };
  const digits = s => s.replace(/\D/g, "");
  const newCode = () => "BK-" + Array.from({ length: 4 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.random() * 32 | 0]).join("");
  const val = f => (typeof f === "function" ? f() : f);

  /* ---------- storage ---------- */
  function seed() {
    const t = today(), add = n => iso(new Date(t.getFullYear(), t.getMonth(), t.getDate() + n));
    const base = { name: "Khách Demo", phone: C.demoPhone, status: "active", staffId: null };
    return [
      { ...base, id: "BK-DEMO", serviceId: "s2", date: add(2), time: "10:00", note: "" },
      { ...base, id: "BK-D3MO", serviceId: "s1", date: add(6), time: "14:30", note: "Muốn được tư vấn về gói cao cấp" },
      { ...base, id: "BK-OLD1", serviceId: "s4", date: add(-5), time: "09:30", note: "" }
    ];
  }
  function load() {
    try { const v = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(v)) return v; } catch (e) {}
    return seed();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(bookings)); } catch (e) {} }
  let bookings = load();

  /* ---------- lịch trống ---------- */
  function slotsFor() {
    const out = [];
    for (let m = C.openHour * 60; m < C.closeHour * 60; m += C.slotMinutes) out.push(`${pad(m / 60 | 0)}:${pad(m % 60)}`);
    return out;
  }
  // Giả lập một số khung giờ đã kín (ổn định theo ngày + người phụ trách) để demo trông thực tế
  function fakeFull(date, time, staffId) {
    let h = 0; for (const c of date + time + (staffId || "")) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h % 4 === 0;
  }
  function isTaken(date, time, staffId = null, ignoreId = null) {
    if (fakeFull(date, time, staffId)) return true;
    return bookings.some(b => b.status === "active" && b.date === date && b.time === time && (b.staffId || null) === (staffId || null) && b.id !== ignoreId);
  }
  function isPast(date, time) {
    const [h, m] = time.split(":").map(Number), d = parse(date); d.setHours(h, m);
    return d <= new Date();
  }
  const dayOpen = d => d >= today() && !C.closedWeekdays.includes(d.getDay());
  const freeCount = (date, staffId, ignoreId) => slotsFor().filter(t => !isPast(date, t) && !isTaken(date, t, staffId, ignoreId)).length;

  /* ---------- toast / confirm ---------- */
  let toastTimer;
  const hideToast = () => $("#toast").classList.remove("show");
  function toast(msg, action) {
    const t = $("#toast");
    t.innerHTML = `<span>${esc(msg)}</span>`;
    if (action) { const b = document.createElement("button"); b.textContent = action.label; b.onclick = () => { action.fn(); hideToast(); }; t.append(b); }
    t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, action ? 7000 : 3200);
  }
  function confirmDialog(title, text) {
    return new Promise(res => {
      const d = $("#confirm"); $("#confirmTitle").textContent = title; $("#confirmText").textContent = text;
      d.returnValue = ""; d.showModal(); d.addEventListener("close", () => res(d.returnValue === "yes"), { once: true });
    });
  }

  /* ---------- thành phần dùng chung ---------- */
  // Lịch tháng có chấm màu báo mức độ còn trống. o: {sel, pick, staff, ignore, current, month}
  function mountCalendar(el, o) {
    const t0 = today();
    let m = new Date((o.month || t0).getFullYear(), (o.month || t0).getMonth(), 1);
    function render() {
      const minM = new Date(t0.getFullYear(), t0.getMonth(), 1), maxM = new Date(t0.getFullYear(), t0.getMonth() + C.maxMonthsAhead, 1);
      const first = new Date(m.getFullYear(), m.getMonth(), 1), lead = (first.getDay() + 6) % 7, days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      const total = slotsFor().length, sel = val(o.sel), cur = val(o.current);
      let cells = "<span></span>".repeat(lead);
      for (let d = 1; d <= days; d++) {
        const dt = new Date(m.getFullYear(), m.getMonth(), d), s = iso(dt), open = dayOpen(dt);
        const free = open ? freeCount(s, val(o.staff), val(o.ignore)) : 0, off = !open || free === 0;
        const heat = off ? "" : `<i class="heat ${free / total > .5 ? "hi" : free / total > .2 ? "mid" : "lo"}"></i>`;
        const cls = ["day", s === iso(t0) && "today", s === sel && "is-sel", cur === s && "current"].filter(Boolean).join(" ");
        cells += `<button type="button" class="${cls}" data-date="${s}" ${off ? "disabled" : ""}>${d}${heat}</button>`;
      }
      el.innerHTML = `<div class="cal-head"><button type="button" class="icon-btn" data-nav="-1" aria-label="Tháng trước" ${m <= minM ? "disabled" : ""}>‹</button>
        <strong>Tháng ${m.getMonth() + 1}, ${m.getFullYear()}</strong>
        <button type="button" class="icon-btn" data-nav="1" aria-label="Tháng sau" ${m >= maxM ? "disabled" : ""}>›</button></div>
        <div class="cal-grid cal-dow"><span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span></div>
        <div class="cal-grid">${cells}</div>
        <div class="legend"><i class="heat hi"></i>Nhiều chỗ <i class="heat mid"></i>Sắp kín <i class="heat lo"></i>Còn ít</div>`;
      $$("[data-nav]", el).forEach(b => b.onclick = () => { m = new Date(m.getFullYear(), m.getMonth() + +b.dataset.nav, 1); render(); });
      $$(".day", el).forEach(b => b.onclick = () => o.pick(b.dataset.date));
    }
    render();
    return { render };
  }

  // Dải ngày cuộn ngang (chỉ hiện những ngày còn chỗ)
  function mountStrip(el, o) {
    function render() {
      const sel = val(o.sel), out = [], t = today();
      for (let i = 0; i < 60 && out.length < 14; i++) {
        const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + i), s = iso(d);
        if (dayOpen(d) && freeCount(s, val(o.staff), val(o.ignore)) > 0) out.push([d, s]);
      }
      el.innerHTML = `<div class="strip">${out.map(([d, s]) => `<button type="button" class="sday ${s === sel ? "is-sel" : ""}" data-date="${s}">
        <small>${DOW_S[d.getDay()]}</small><b>${d.getDate()}</b><small>Th${d.getMonth() + 1}</small></button>`).join("")}</div>`;
      $$(".sday", el).forEach(b => b.onclick = () => o.pick(b.dataset.date));
    }
    render();
    return { render };
  }

  // Lưới giờ. o: {date, sel, pick, staff, ignore}
  function mountSlots(el, o) {
    function render() {
      const date = val(o.date), sel = val(o.sel);
      if (!date) { el.innerHTML = `<div class="slots-title muted">Chọn một ngày để xem giờ trống</div>`; return; }
      el.innerHTML = `<div class="slots-title">Giờ trống · ${fmtDate(date)}</div><div class="slots">${slotsFor().map(t => {
        const off = isPast(date, t) || isTaken(date, t, val(o.staff), val(o.ignore));
        return `<button type="button" class="slot ${t === sel ? "is-sel" : ""}" data-t="${t}" ${off ? "disabled" : ""}>${t}</button>`;
      }).join("")}</div><div class="legend"><i class="dot free"></i>Còn trống <i class="dot full"></i>Đã kín</div>`;
      $$(".slot", el).forEach(b => b.onclick = () => o.pick(b.dataset.t));
    }
    render();
    return { render };
  }

  const formHTML = () => `
    <label class="field">Họ và tên<input name="name" placeholder="Nguyễn Văn A" autocomplete="name"><em class="err" hidden></em></label>
    <label class="field">Số điện thoại<input name="phone" placeholder="0900 000 000" inputmode="tel" autocomplete="tel"><em class="err" hidden></em></label>
    <label class="field">Ghi chú <small>(không bắt buộc)</small><textarea name="note" rows="2" placeholder="Yêu cầu đặc biệt…"></textarea></label>`;

  function readForm(f) {
    const E = f.elements, name = E.name.value.trim(), phone = digits(E.phone.value);
    const bad = (input, msg) => { const fld = input.closest(".field"); fld.classList.toggle("invalid", !!msg); const er = $(".err", fld); er.hidden = !msg; er.textContent = msg || ""; return !!msg; };
    const e1 = bad(E.name, name.length < 2 ? "Vui lòng nhập họ tên" : ""), e2 = bad(E.phone, !/^0\d{9}$/.test(phone) ? "Số điện thoại gồm 10 số, bắt đầu bằng 0" : "");
    return e1 || e2 ? null : { name, phone, note: E.note.value.trim() };
  }

  function summaryHTML(b) {
    const s = svc(b.serviceId), st = staffOf(b.staffId);
    return [`${s.icon} ${esc(s.name)}`, st && `${st.emoji} ${esc(st.name)}`, `📅 ${fmtDate(b.date)}`, `🕒 ${b.time}`, `⏱ ${s.minutes} phút`, `💰 ${money(s.price)}`]
      .filter(Boolean).map(t => `<span class="chip">${t}</span>`).join("");
  }

  function create(d) {
    const st = d.staffId || null;
    if (isPast(d.date, d.time) || isTaken(d.date, d.time, st)) { toast("Khung giờ vừa được đặt, vui lòng chọn giờ khác"); return null; }
    const b = { id: newCode(), status: "active", serviceId: d.serviceId, staffId: st, date: d.date, time: d.time, name: d.name, phone: d.phone, note: d.note || "" };
    bookings.push(b); save(); $("#searchInput").value = b.phone; refreshCount();
    return b;
  }

  function showDone(host, b, title = "Đặt lịch thành công!") {
    host.innerHTML = `<div class="panel success">
      <div class="check">✓</div><h2>${esc(title)}</h2><p class="muted">Mã đặt lịch của bạn</p>
      <div class="code">${b.id}</div><div class="summary">${summaryHTML(b)}</div>
      <p class="muted small">Bạn có thể đổi ngày hoặc hủy lịch bất cứ lúc nào tại mục <b>Lịch của tôi</b>.</p>
      <div class="actions center"><button class="btn primary" id="doneManage">Xem lịch của tôi</button><button class="btn ghost" id="doneHome">Về trang chủ</button></div></div>`;
    $("#doneManage").onclick = () => go("manage"); $("#doneHome").onclick = () => go("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- điều hướng ---------- */
  function go(v) {
    ["home", "book", "manage"].forEach(x => $("#view-" + x).hidden = x !== v);
    $$(".tab").forEach(t => t.classList.toggle("is-active", t.dataset.view === (v === "book" ? "home" : v)));
    if (v === "manage") renderResults();
    if (v !== "book") $("#flowBody").innerHTML = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openFlow(id, opts = {}) {
    const meta = BK.flowMeta.find(f => f.id === id);
    $("#flowName").textContent = meta ? (typeof meta.title === "function" ? meta.title(C) : meta.title) : "Đổi ngày hẹn";
    const body = $("#flowBody"); body.innerHTML = "";
    go("book"); BK.flows[id].mount(body, BK, opts);
  }
  const startReschedule = id => openFlow("reschedule", { id });

  /* ---------- trang chủ ---------- */
  function renderHome() {
    $("#homeTitle").textContent = C.brand.name; $("#homeSub").textContent = C.brand.tagline;
    $("#flowCards").innerHTML = BK.flowMeta.filter(f => f.id !== "reschedule").map(f => `
      <button class="fcard" data-flow="${f.id}">
        <span class="fic">${f.icon}</span><span class="ftag">${f.tag}</span>
        <b>${esc(typeof f.title === "function" ? f.title(C) : f.title)}</b><p>${esc(typeof f.desc === "function" ? f.desc(C) : f.desc)}</p><span class="go">Bắt đầu →</span></button>`).join("");
    $$("[data-flow]").forEach(b => b.onclick = () => openFlow(b.dataset.flow));
    $("#svcStrip").innerHTML = C.services.map(s => `<button class="sitem" data-svc="${s.id}"><span class="ic">${s.icon}</span>
      <span><b>${esc(s.name)}</b><small>${s.minutes} phút · ${money(s.price)}</small></span></button>`).join("");
    $$("[data-svc]").forEach(b => b.onclick = () => openFlow("wizard", { serviceId: b.dataset.svc }));
    const pal = INDUSTRIES.find(x => x.id === tpl.industry).palette;
    $("#paletteBox").innerHTML = pal ? `<h2 class="sec-title">Bảng màu sơn hot trend</h2><div class="palette">${pal.map(c =>
      `<span class="swatch" title="${esc(c.n)}"><i style="background:${c.c}"></i><small>${esc(c.n)}</small></span>`).join("")}</div>` : "";
  }

  /* ---------- lịch của tôi ---------- */
  function refreshCount() {
    const q = $("#searchInput").value.trim(), qd = digits(q);
    const n = q ? bookings.filter(b => b.status === "active" && (b.id === q.toUpperCase() || (qd.length >= 9 && b.phone === qd)) && parse(b.date) >= today()).length : 0;
    $("#tabCount").hidden = !n; $("#tabCount").textContent = n;
  }
  function renderResults() {
    const q = $("#searchInput").value.trim(), box = $("#results");
    refreshCount();
    if (!q) { box.innerHTML = `<div class="empty"><div class="big">🔍</div>Nhập số điện thoại hoặc mã đặt lịch để bắt đầu</div>`; return; }
    const qd = digits(q), qc = q.toUpperCase();
    const list = bookings.filter(b => b.id === qc || (qd.length >= 9 && b.phone === qd));
    if (!list.length) { box.innerHTML = `<div class="empty"><div class="big">📭</div>Không tìm thấy lịch nào với “${esc(q)}”</div>`; return; }
    const now = new Date(), when = b => { const d = parse(b.date), [h, m] = b.time.split(":"); d.setHours(h, m); return d; };
    const up = list.filter(b => b.status === "active" && when(b) >= now).sort((a, b) => when(a) - when(b));
    const past = list.filter(b => b.status === "active" && when(b) < now).sort((a, b) => when(b) - when(a));
    const canc = list.filter(b => b.status === "cancelled").sort((a, b) => when(b) - when(a));
    const card = (b, kind) => {
      const s = svc(b.serviceId), st = staffOf(b.staffId), d = parse(b.date);
      const ops = kind === "up" ? `<button class="btn ghost" data-act="move" data-id="${b.id}">📅 Đổi ngày</button><button class="btn ghost" data-act="cancel" data-id="${b.id}" style="color:var(--danger)">Hủy lịch</button>`
        : kind === "canc" ? `<button class="btn ghost" data-act="restore" data-id="${b.id}">↩ Khôi phục</button>` : "";
      return `<div class="appt ${kind === "canc" ? "cancelled" : kind === "past" ? "past" : ""}">
        <div class="date"><small>Th${d.getMonth() + 1}</small><b>${d.getDate()}</b><small>${DOW_S[d.getDay()]}</small></div>
        <div class="info"><b>${s.icon} ${esc(s.name)}<span class="badge">${kind === "canc" ? "Đã hủy" : kind === "past" ? "Đã qua" : "Sắp tới"}</span></b>
          <span>🕒 ${b.time} · ${s.minutes} phút · ${money(s.price)}${st ? ` · ${st.emoji} ${esc(st.name)}` : ""}</span>
          <span>Mã: ${b.id} · ${esc(b.name)}</span>${b.note ? `<span>📝 ${esc(b.note)}</span>` : ""}</div>
        <div class="ops">${ops}</div></div>`;
    };
    box.innerHTML =
      (up.length ? `<div class="group-title">Sắp tới (${up.length})</div>${up.map(b => card(b, "up")).join("")}` : `<div class="empty"><div class="big">🗓️</div>Bạn chưa có lịch sắp tới<br><button class="btn primary" id="emptyBook" style="margin-top:14px">Đặt lịch ngay</button></div>`) +
      (canc.length ? `<div class="group-title">Đã hủy</div>${canc.map(b => card(b, "canc")).join("")}` : "") +
      (past.length ? `<div class="group-title">Đã qua</div>${past.map(b => card(b, "past")).join("")}` : "");
    const eb = $("#emptyBook"); if (eb) eb.onclick = () => go("home");
  }
  async function onResultsClick(e) {
    const btn = e.target.closest("[data-act]"); if (!btn) return;
    const b = bookings.find(x => x.id === btn.dataset.id); if (!b) return;
    if (btn.dataset.act === "move") return startReschedule(b.id);
    if (btn.dataset.act === "cancel") {
      if (!await confirmDialog("Hủy lịch hẹn này?", `${svc(b.serviceId).name} · ${fmtDate(b.date)}, ${b.time}`)) return;
      b.status = "cancelled"; save(); renderResults();
      toast("Đã hủy lịch hẹn", { label: "Hoàn tác", fn: () => { b.status = "active"; save(); renderResults(); toast("Đã khôi phục lịch hẹn"); } });
    }
    if (btn.dataset.act === "restore") {
      if (isPast(b.date, b.time) || isTaken(b.date, b.time, b.staffId, b.id)) return toast("Khung giờ này không còn trống. Hãy đặt lịch mới.");
      b.status = "active"; save(); renderResults(); toast("Đã khôi phục lịch hẹn");
    }
  }

  /* ---------- mẫu giao diện / ngành ---------- */
  const lsGet = k => { try { return localStorage.getItem("booking-tpl-" + k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem("booking-tpl-" + k, v); } catch (e) {} };
  const pick = (list, want, def) => (list.find(x => x.id === want) || list.find(x => x.id === def) || list[0]).id;
  const tpl = {};
  function syncUrl() {
    const u = new URL(location.href); u.searchParams.set("theme", tpl.theme); u.searchParams.set("industry", tpl.industry);
    try { history.replaceState(null, "", u); } catch (e) {}
  }
  function applyTheme(id) { tpl.theme = id; lsSet("theme", id); document.documentElement.dataset.theme = id; syncUrl(); renderPicker(); }
  function applyIndustry(id) {
    tpl.industry = id; lsSet("industry", id);
    const ind = INDUSTRIES.find(x => x.id === id);
    C.brand = ind.brand; C.services = ind.services; C.staff = ind.staff; C.staffLabel = ind.staffLabel;
    document.title = `${C.brand.name} · Đặt lịch`;
    $("#brandName").textContent = C.brand.name; $("#brandEmoji").textContent = C.brand.emoji;
    renderHome(); renderResults(); go("home"); syncUrl(); renderPicker();
  }
  function renderPicker() {
    $("#themeGrid").innerHTML = THEMES.map(t => `<button class="tpl-card ${t.id === tpl.theme ? "is-on" : ""}" data-theme-id="${t.id}">
      <span class="sw"><i style="background:${t.sw[1]}"></i><i style="background:${t.sw[2]}"></i><i style="background:${t.sw[0]}"></i></span><b>${t.name}</b><small>${t.desc}</small></button>`).join("");
    $("#industryGrid").innerHTML = INDUSTRIES.map(i => `<button class="tpl-card ${i.id === tpl.industry ? "is-on" : ""}" data-ind-id="${i.id}">
      <span class="ind">${i.icon}</span><b>${i.name}</b><small>${i.brand.name}</small></button>`).join("");
    $$("[data-theme-id]").forEach(b => b.onclick = () => applyTheme(b.dataset.themeId));
    $$("[data-ind-id]").forEach(b => b.onclick = () => { const ind = INDUSTRIES.find(x => x.id === b.dataset.indId); if (ind.theme) applyTheme(ind.theme); applyIndustry(ind.id); $("#tplDialog").close(); });
  }

  /* ---------- khởi động ---------- */
  function boot() {
    const qs = new URLSearchParams(location.search);
    tpl.theme = pick(THEMES, qs.get("theme") || lsGet("theme"), C.defaultTheme);
    tpl.industry = pick(INDUSTRIES, qs.get("industry") || lsGet("industry"), C.defaultIndustry);

    $$(".tab").forEach(t => t.onclick = () => go(t.dataset.view));
    $("#brandBtn").onclick = () => go("home");
    $("#flowBack").onclick = () => go("home");
    $("#ctaStart").onclick = () => $("#flowTitle").scrollIntoView({ behavior: "smooth", block: "start" });
    $("#ctaManage").onclick = () => go("manage");
    $("#results").onclick = onResultsClick;
    $("#searchForm").onsubmit = e => { e.preventDefault(); renderResults(); };
    $("#resetDemo").onclick = () => { bookings = seed(); save(); go("home"); renderResults(); toast("Đã đặt lại dữ liệu mẫu"); };
    $("#tplFab").hidden = !C.showTemplatePicker;
    $("#tplFab").onclick = () => $("#tplDialog").showModal();
    $("#tplClose").onclick = () => $("#tplDialog").close();
    $("#tplDialog").addEventListener("click", e => { if (e.target === e.currentTarget) e.currentTarget.close(); });

    const p = C.demoPhone;
    $("#demoHint").innerHTML = `Dùng thử: <button type="button" id="fillDemo">${p.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")}</button>`;
    $("#fillDemo").onclick = () => { $("#searchInput").value = p; renderResults(); };
    applyTheme(tpl.theme); applyIndustry(tpl.industry);
  }

  window.BK = {
    C, $, $$, esc, pad, iso, parse, today, money, fmtDate, digits, val, DOW_S,
    svc, staffOf, slotsFor, isTaken, isPast, dayOpen, freeCount,
    mountCalendar, mountStrip, mountSlots, formHTML, readForm, summaryHTML,
    create, showDone, toast, go, openFlow, renderResults, save, get bookings() { return bookings; },
    flows: {}, flowMeta: [], boot
  };
})();
