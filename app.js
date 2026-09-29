(() => {
  const C = window.CONFIG;
  C.services = []; C.brand = {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = "booking-demo-v1";
  const DOW = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

  /* ---------- helpers ---------- */
  const pad = n => String(n).padStart(2, "0");
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const money = n => n ? n.toLocaleString("vi-VN") + "đ" : "Miễn phí";
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const svc = id => C.services.find(s => s.id === id) || C.services[0];
  const fmtDate = s => { const d = parse(s); return `${DOW[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };
  const digits = s => s.replace(/\D/g, "");
  const newCode = () => "BK-" + Array.from({ length: 4 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.random() * 32 | 0]).join("");

  /* ---------- storage ---------- */
  function seed() {
    const t = today(), add = n => iso(new Date(t.getFullYear(), t.getMonth(), t.getDate() + n));
    return [
      { id: "BK-DEMO", serviceId: "s2", date: add(2), time: "10:00", name: "Khách Demo", phone: C.demoPhone, note: "", status: "active" },
      { id: "BK-D3MO", serviceId: "s1", date: add(6), time: "14:30", name: "Khách Demo", phone: C.demoPhone, note: "Muốn được tư vấn về gói cao cấp", status: "active" },
      { id: "BK-OLD1", serviceId: "s4", date: add(-5), time: "09:30", name: "Khách Demo", phone: C.demoPhone, note: "", status: "active" }
    ];
  }
  function load() {
    try { const v = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(v)) return v; } catch (e) {}
    return seed();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(bookings)); } catch (e) {} }
  let bookings = load();

  /* ---------- availability ---------- */
  function slotsFor() {
    const out = [];
    for (let m = C.openHour * 60; m < C.closeHour * 60; m += C.slotMinutes) out.push(`${pad(m / 60 | 0)}:${pad(m % 60)}`);
    return out;
  }
  // "Giả lập" một số khung giờ đã kín để demo trông thực tế (ổn định theo từng ngày)
  function fakeFull(date, time) {
    let h = 0; for (const c of date + time) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h % 4 === 0;
  }
  function isTaken(date, time) {
    if (fakeFull(date, time)) return true;
    return bookings.some(b => b.status === "active" && b.date === date && b.time === time && b.id !== state.editId);
  }
  function isPastSlot(date, time) {
    const [h, m] = time.split(":").map(Number), d = parse(date); d.setHours(h, m);
    return d <= new Date();
  }
  function dayOpen(d) { return d >= today() && !C.closedWeekdays.includes(d.getDay()); }

  /* ---------- state ---------- */
  const state = { step: 1, serviceId: null, date: null, time: null, month: null, editId: null };
  state.month = new Date(today().getFullYear(), today().getMonth(), 1);

  /* ---------- toast / confirm ---------- */
  let toastTimer;
  function toast(msg, action) {
    const t = $("#toast");
    t.innerHTML = `<span>${esc(msg)}</span>`;
    if (action) { const b = document.createElement("button"); b.textContent = action.label; b.onclick = () => { action.fn(); hideToast(); }; t.append(b); }
    t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, action ? 7000 : 3200);
  }
  const hideToast = () => $("#toast").classList.remove("show");
  function confirmDialog(title, text) {
    return new Promise(res => {
      const d = $("#confirm"); $("#confirmTitle").textContent = title; $("#confirmText").textContent = text;
      d.returnValue = ""; d.showModal(); d.addEventListener("close", () => res(d.returnValue === "yes"), { once: true });
    });
  }

  /* ---------- view switching ---------- */
  function showView(v) {
    $$(".tab").forEach(t => t.classList.toggle("is-active", t.dataset.view === v));
    $("#view-book").hidden = v !== "book"; $("#view-manage").hidden = v !== "manage";
    if (v === "manage") renderResults();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  $$(".tab").forEach(t => t.onclick = () => {
    if (t.dataset.view === "book" && state.editId) resetBooking();
    showView(t.dataset.view);
  });

  /* ---------- booking flow ---------- */
  function goStep(n) {
    state.step = n;
    ["step1", "step2", "step3", "done"].forEach((id, i) => $("#" + id).hidden = (n === "done" ? id !== "done" : i + 1 !== n));
    $("#steps").hidden = n === "done";
    $$("#steps li").forEach(li => {
      const s = +li.dataset.step;
      li.classList.toggle("is-active", s === n); li.classList.toggle("is-done", n !== "done" && s < n);
    });
    if (n === 2) { renderCal(); renderSlots(); }
    if (n === 3) renderSummary($("#summary"));
    if (n !== 1) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderServices() {
    $("#services").innerHTML = C.services.map(s => `
      <button class="svc" data-id="${s.id}">
        <div class="ic">${s.icon}</div><b>${esc(s.name)}</b><p>${esc(s.desc)}</p>
        <div class="meta"><span>⏱ ${s.minutes} phút</span><span>${money(s.price)}</span></div>
      </button>`).join("");
    $$(".svc").forEach(b => b.onclick = () => { state.serviceId = b.dataset.id; state.date = state.time = null; goStep(2); });
  }

  function renderCal() {
    const m = state.month, first = new Date(m.getFullYear(), m.getMonth(), 1);
    $("#monthLabel").textContent = `Tháng ${m.getMonth() + 1}, ${m.getFullYear()}`;
    const t0 = today(), minM = new Date(t0.getFullYear(), t0.getMonth(), 1), maxM = new Date(t0.getFullYear(), t0.getMonth() + C.maxMonthsAhead, 1);
    $("#prevMonth").disabled = m <= minM; $("#nextMonth").disabled = m >= maxM;
    const lead = (first.getDay() + 6) % 7, days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    let html = "<span></span>".repeat(lead);
    const cur = state.editId && bookings.find(b => b.id === state.editId);
    for (let d = 1; d <= days; d++) {
      const dt = new Date(m.getFullYear(), m.getMonth(), d), s = iso(dt);
      const cls = ["day", s === iso(t0) && "today", s === state.date && "is-sel", cur && cur.date === s && "current"].filter(Boolean).join(" ");
      html += `<button class="${cls}" data-date="${s}" ${dayOpen(dt) ? "" : "disabled"}>${d}</button>`;
    }
    $("#calDays").innerHTML = html;
    $$(".day").forEach(b => b.onclick = () => { state.date = b.dataset.date; state.time = null; renderCal(); renderSlots(); });
  }

  function renderSlots() {
    const box = $("#slots"), title = $("#slotsTitle");
    if (!state.date) { title.textContent = "Chọn một ngày để xem giờ trống"; box.innerHTML = ""; $("#next2").disabled = true; return; }
    title.textContent = `Giờ trống · ${fmtDate(state.date)}`;
    box.innerHTML = slotsFor().map(t => {
      const off = isTaken(state.date, t) || isPastSlot(state.date, t);
      return `<button class="slot ${t === state.time ? "is-sel" : ""}" data-t="${t}" ${off ? "disabled" : ""}>${t}</button>`;
    }).join("");
    $$(".slot").forEach(b => b.onclick = () => { state.time = b.dataset.t; renderSlots(); });
    $("#next2").disabled = !state.time;
  }

  function renderSummary(el, b) {
    const s = svc(b ? b.serviceId : state.serviceId), date = b ? b.date : state.date, time = b ? b.time : state.time;
    el.innerHTML = [`${s.icon} ${esc(s.name)}`, `📅 ${fmtDate(date)}`, `🕒 ${time}`, `⏱ ${s.minutes} phút`, `💰 ${money(s.price)}`]
      .map(t => `<span class="chip">${t}</span>`).join("");
  }

  function resetBooking() {
    state.serviceId = state.date = state.time = state.editId = null;
    $("#form").reset(); $$(".field").forEach(f => { f.classList.remove("invalid"); $(".err", f) && ($(".err", f).hidden = true); });
    $("#heroTitle").textContent = "Đặt lịch hẹn"; $("#heroSub").textContent = C.brand.tagline;
    $("#step2Title").textContent = "Chọn ngày & giờ"; $("#back2").hidden = false; $("#next2").textContent = "Tiếp tục";
    goStep(1);
  }

  $("#back2").onclick = () => goStep(1);
  $("#back3").onclick = () => goStep(2);
  $("#prevMonth").onclick = () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1); renderCal(); };
  $("#nextMonth").onclick = () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1); renderCal(); };

  $("#next2").onclick = () => {
    if (state.editId) return commitReschedule();
    goStep(3);
  };

  $("#form").onsubmit = e => {
    e.preventDefault();
    const f = e.target, name = f.name.value.trim(), phone = digits(f.phone.value);
    const bad = (input, msg) => { const fld = input.closest(".field"); fld.classList.toggle("invalid", !!msg); const er = $(".err", fld); er.hidden = !msg; er.textContent = msg || ""; return !!msg; };
    const e1 = bad(f.name, name.length < 2 ? "Vui lòng nhập họ tên" : ""), e2 = bad(f.phone, !/^0\d{9}$/.test(phone) ? "Số điện thoại gồm 10 số, bắt đầu bằng 0" : "");
    if (e1 || e2) return;
    if (isTaken(state.date, state.time)) { toast("Khung giờ vừa được đặt, vui lòng chọn giờ khác"); state.time = null; return goStep(2); }
    const b = { id: newCode(), serviceId: state.serviceId, date: state.date, time: state.time, name, phone, note: f.note.value.trim(), status: "active" };
    bookings.push(b); save(); refreshCount();
    $("#doneTitle").textContent = "Đặt lịch thành công!"; $("#doneCode").textContent = b.id;
    renderSummary($("#doneSummary"), b);
    $("#searchInput").value = phone; f.reset();
    goStep("done");
  };

  $("#goManage").onclick = () => { state.editId = null; showView("manage"); };
  $("#bookAgain").onclick = resetBooking;

  /* ---------- reschedule ---------- */
  function startReschedule(id) {
    const b = bookings.find(x => x.id === id); if (!b) return;
    state.editId = id; state.serviceId = b.serviceId; state.date = null; state.time = null;
    state.month = new Date(parse(b.date) < today() ? today().getFullYear() : parse(b.date).getFullYear(), parse(b.date) < today() ? today().getMonth() : parse(b.date).getMonth(), 1);
    $("#heroTitle").textContent = "Đổi ngày hẹn";
    $("#heroSub").textContent = `${svc(b.serviceId).name} · hiện tại: ${fmtDate(b.date)}, ${b.time}`;
    $("#step2Title").textContent = "Chọn ngày & giờ mới"; $("#back2").hidden = true; $("#next2").textContent = "Xác nhận đổi lịch";
    $("#steps").hidden = true;
    showView("book"); goStep(2); $("#steps").hidden = true;
  }
  function commitReschedule() {
    const b = bookings.find(x => x.id === state.editId); if (!b) return;
    const old = { date: b.date, time: b.time };
    b.date = state.date; b.time = state.time; save();
    toast(`Đã đổi sang ${fmtDate(b.date)}, ${b.time}`, { label: "Hoàn tác", fn: () => { b.date = old.date; b.time = old.time; save(); renderResults(); toast("Đã khôi phục lịch cũ"); } });
    resetBooking(); showView("manage");
  }

  /* ---------- manage ---------- */
  function renderResults(highlightId) {
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
      const s = svc(b.serviceId), d = parse(b.date);
      const ops = kind === "up" ? `<button class="btn ghost" data-act="move" data-id="${b.id}">📅 Đổi ngày</button><button class="btn ghost" data-act="cancel" data-id="${b.id}" style="color:var(--danger)">Hủy lịch</button>`
        : kind === "canc" ? `<button class="btn ghost" data-act="restore" data-id="${b.id}">↩ Khôi phục</button>` : "";
      return `<div class="appt ${kind === "canc" ? "cancelled" : kind === "past" ? "past" : ""}">
        <div class="date"><small>Th${d.getMonth() + 1}</small><b>${d.getDate()}</b><small>${["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()]}</small></div>
        <div class="info"><b>${s.icon} ${esc(s.name)}<span class="badge">${kind === "canc" ? "Đã hủy" : kind === "past" ? "Đã qua" : "Sắp tới"}</span></b>
          <span>🕒 ${b.time} · ${s.minutes} phút · ${money(s.price)}</span><span>Mã: ${b.id} · ${esc(b.name)}</span>${b.note ? `<span>📝 ${esc(b.note)}</span>` : ""}</div>
        <div class="ops">${ops}</div></div>`;
    };
    box.innerHTML =
      (up.length ? `<div class="group-title">Sắp tới (${up.length})</div>${up.map(b => card(b, "up")).join("")}` : `<div class="empty"><div class="big">🗓️</div>Bạn chưa có lịch sắp tới<br><button class="btn primary" id="emptyBook" style="margin-top:14px">Đặt lịch ngay</button></div>`) +
      (canc.length ? `<div class="group-title">Đã hủy</div>${canc.map(b => card(b, "canc")).join("")}` : "") +
      (past.length ? `<div class="group-title">Đã qua</div>${past.map(b => card(b, "past")).join("")}` : "");
    const eb = $("#emptyBook"); if (eb) eb.onclick = () => { resetBooking(); showView("book"); };
  }

  $("#results").onclick = async e => {
    const btn = e.target.closest("[data-act]"); if (!btn) return;
    const b = bookings.find(x => x.id === btn.dataset.id); if (!b) return;
    if (btn.dataset.act === "move") return startReschedule(b.id);
    if (btn.dataset.act === "cancel") {
      const ok = await confirmDialog("Hủy lịch hẹn này?", `${svc(b.serviceId).name} · ${fmtDate(b.date)}, ${b.time}`);
      if (!ok) return;
      b.status = "cancelled"; save(); renderResults();
      toast("Đã hủy lịch hẹn", { label: "Hoàn tác", fn: () => { b.status = "active"; save(); renderResults(); toast("Đã khôi phục lịch hẹn"); } });
    }
    if (btn.dataset.act === "restore") {
      if (isTaken(b.date, b.time) || isPastSlot(b.date, b.time)) return toast("Khung giờ này không còn trống. Hãy đặt lịch mới.");
      b.status = "active"; save(); renderResults(); toast("Đã khôi phục lịch hẹn");
    }
  };

  $("#searchForm").onsubmit = e => { e.preventDefault(); renderResults(); };
  function refreshCount() {
    const q = $("#searchInput").value.trim(), qd = digits(q), n = q ? bookings.filter(b => b.status === "active" && (b.id === q.toUpperCase() || (qd.length >= 9 && b.phone === qd)) && parse(b.date) >= today()).length : 0;
    $("#tabCount").hidden = !n; $("#tabCount").textContent = n;
  }

  $("#resetDemo").onclick = () => { bookings = seed(); save(); resetBooking(); showView("book"); toast("Đã đặt lại dữ liệu mẫu"); renderResults(); };

  /* ---------- init ---------- */
  /* ---------- mẫu giao diện / ngành ---------- */
  const qs = new URLSearchParams(location.search);
  const pick = (list, want, def) => (list.find(x => x.id === want) || list.find(x => x.id === def) || list[0]).id;
  const tpl = {
    theme: pick(THEMES, qs.get("theme") || lsGet("theme"), C.defaultTheme),
    industry: pick(INDUSTRIES, qs.get("industry") || lsGet("industry"), C.defaultIndustry)
  };
  function lsGet(k) { try { return localStorage.getItem("booking-tpl-" + k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem("booking-tpl-" + k, v); } catch (e) {} }
  function syncUrl() {
    const u = new URL(location.href); u.searchParams.set("theme", tpl.theme); u.searchParams.set("industry", tpl.industry);
    try { history.replaceState(null, "", u); } catch (e) {}
  }
  function applyTheme(id) {
    tpl.theme = id; lsSet("theme", id); document.documentElement.dataset.theme = id;
    const t = THEMES.find(x => x.id === id); $('meta[name="theme-color"]') && ($('meta[name="theme-color"]').content = t.sw[1]);
    syncUrl(); renderPicker();
  }
  function applyIndustry(id) {
    tpl.industry = id; lsSet("industry", id);
    const ind = INDUSTRIES.find(x => x.id === id);
    C.brand = ind.brand; C.services = ind.services;
    document.title = `${C.brand.name} · Đặt lịch`;
    $("#brandName").textContent = C.brand.name; $("#brandEmoji").textContent = C.brand.emoji;
    resetBooking(); renderServices(); renderResults(); syncUrl(); renderPicker();
  }
  function renderPicker() {
    $("#themeGrid").innerHTML = THEMES.map(t => `
      <button class="tpl-card ${t.id === tpl.theme ? "is-on" : ""}" data-theme-id="${t.id}">
        <span class="sw"><i style="background:${t.sw[1]}"></i><i style="background:${t.sw[2]}"></i><i style="background:${t.sw[0]}"></i></span>
        <b>${t.name}</b><small>${t.desc}</small></button>`).join("");
    $("#industryGrid").innerHTML = INDUSTRIES.map(i => `
      <button class="tpl-card ${i.id === tpl.industry ? "is-on" : ""}" data-ind-id="${i.id}">
        <span class="ind">${i.icon}</span><b>${i.name}</b><small>${i.brand.name}</small></button>`).join("");
    $$("[data-theme-id]").forEach(b => b.onclick = () => applyTheme(b.dataset.themeId));
    $$("[data-ind-id]").forEach(b => b.onclick = () => applyIndustry(b.dataset.indId));
  }
  $("#tplFab").hidden = !C.showTemplatePicker;
  $("#tplFab").onclick = () => $("#tplDialog").showModal();
  $("#tplClose").onclick = () => $("#tplDialog").close();
  $("#tplDialog").addEventListener("click", e => { if (e.target === e.currentTarget) e.currentTarget.close(); });

  /* ---------- init ---------- */
  const p = C.demoPhone;
  $("#demoHint").innerHTML = `Dùng thử: <button type="button" id="fillDemo">${p.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")}</button>`;
  $("#fillDemo").onclick = () => { $("#searchInput").value = p; renderResults(); };
  applyTheme(tpl.theme); applyIndustry(tpl.industry);
})();
