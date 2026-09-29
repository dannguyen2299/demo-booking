// CÁC LUỒNG ĐẶT LỊCH. Mỗi luồng là một object { mount(host, BK, opts) } đăng ký vào BK.flows.
// Thêm luồng mới: thêm vào BK.flows và một dòng trong BK.flowMeta (hiện thành thẻ ở trang chủ).
(() => {
  const { C, $, $$, esc, money, fmtDate, iso, parse, today } = BK;
  const F = BK.flows;
  const q = (host, s) => host.querySelector(s);
  const lbl = () => C.staffLabel.toLowerCase();

  BK.flowMeta = [
    { id: "wizard", icon: "🧭", tag: "Phổ biến", title: "Đặt từng bước", desc: "Chọn dịch vụ, rồi ngày giờ, rồi thông tin. Dễ nhất cho khách mới." },
    { id: "calendar", icon: "🗓️", tag: "Trực quan", title: "Xem lịch tháng", desc: "Nhìn toàn cảnh ngày còn chỗ trên lịch, bấm ngày rồi chọn giờ." },
    { id: "onepage", icon: "⚡", tag: "Nhanh nhất", title: "Đặt trên một trang", desc: "Mọi thứ trên một màn hình, kèm khung tóm tắt cập nhật tức thì." },
    { id: "staff", icon: "👤", tag: "Cá nhân hóa", title: c => `Chọn ${c.staffLabel.toLowerCase()}`, desc: c => `Chọn ${c.staffLabel.toLowerCase()} ưng ý và xem lịch trống riêng.` },
    { id: "chat", icon: "💬", tag: "Mới lạ", title: "Đặt qua trò chuyện", desc: "Trợ lý hỏi từng câu, bạn chỉ cần bấm chọn." },
    { id: "reschedule", icon: "📅", tag: "", title: "Đổi ngày hẹn", desc: "" }
  ];

  const svcCards = sel => C.services.map(s => `
    <button type="button" class="svc ${s.id === sel ? "is-sel" : ""}" data-id="${s.id}">
      <div class="ic">${s.icon}</div><b>${esc(s.name)}</b><p>${esc(s.desc)}</p>
      <div class="meta"><span>⏱ ${s.minutes} phút</span><span>${money(s.price)}</span></div></button>`).join("");

  const nextFree = staffId => {
    for (let i = 0; i < 45; i++) {
      const d = new Date(today().getFullYear(), today().getMonth(), today().getDate() + i), s = iso(d);
      if (!BK.dayOpen(d)) continue;
      const t = BK.slotsFor().find(t => !BK.isPast(s, t) && !BK.isTaken(s, t, staffId));
      if (t) return `${i === 0 ? "Hôm nay" : i === 1 ? "Ngày mai" : BK.DOW_S[d.getDay()] + " " + d.getDate() + "/" + (d.getMonth() + 1)}, ${t}`;
    }
    return "Chưa có lịch";
  };

  /* ============ 1. WIZARD: từng bước ============ */
  F.wizard = {
    mount(host, BK, opts) {
      const st = { step: opts.serviceId ? 2 : 1, serviceId: opts.serviceId || null, date: null, time: null };
      host.innerHTML = `<div class="hero slim"><h1>Đặt lịch hẹn</h1><p>${esc(C.brand.tagline)}</p></div>
        <ol class="steps"><li data-step="1"><span>1</span>Dịch vụ</li><li data-step="2"><span>2</span>Ngày &amp; giờ</li><li data-step="3"><span>3</span>Thông tin</li></ol>
        <div id="wbody"></div>`;
      const body = q(host, "#wbody");
      function draw() {
        $$(".steps li", host).forEach(li => { const s = +li.dataset.step; li.classList.toggle("is-active", s === st.step); li.classList.toggle("is-done", s < st.step); });
        if (st.step === 1) {
          body.innerHTML = `<div class="panel"><h2>Bạn muốn đặt dịch vụ nào?</h2><div class="services">${svcCards()}</div></div>`;
          $$(".svc", body).forEach(b => b.onclick = () => { st.serviceId = b.dataset.id; st.date = st.time = null; st.step = 2; draw(); });
        } else if (st.step === 2) {
          body.innerHTML = `<div class="panel"><div class="panel-head"><h2>Chọn ngày &amp; giờ</h2><button class="link" id="b2">← Đổi dịch vụ</button></div>
            <div class="picker"><div id="cal"></div><div id="slots"></div></div>
            <div class="actions"><button class="btn primary" id="n2" disabled>Tiếp tục</button></div></div>`;
          const cal = BK.mountCalendar(q(body, "#cal"), { sel: () => st.date, pick: d => { st.date = d; st.time = null; cal.render(); slots.render(); n2.disabled = true; } });
          const slots = BK.mountSlots(q(body, "#slots"), { date: () => st.date, sel: () => st.time, pick: t => { st.time = t; slots.render(); n2.disabled = false; } });
          const n2 = q(body, "#n2"); n2.onclick = () => { st.step = 3; draw(); };
          q(body, "#b2").onclick = () => { st.step = 1; draw(); };
        } else {
          body.innerHTML = `<div class="panel"><div class="panel-head"><h2>Thông tin của bạn</h2><button class="link" id="b3">← Đổi ngày giờ</button></div>
            <div class="summary">${BK.summaryHTML(st)}</div>
            <form id="f" novalidate>${BK.formHTML()}<div class="actions"><button class="btn primary" type="submit">Xác nhận đặt lịch</button></div></form></div>`;
          q(body, "#b3").onclick = () => { st.step = 2; draw(); };
          q(body, "#f").onsubmit = e => {
            e.preventDefault(); const d = BK.readForm(e.target); if (!d) return;
            const b = BK.create({ ...st, ...d });
            if (b) BK.showDone(host, b); else { st.time = null; st.step = 2; draw(); }
          };
        }
        if (st.step > 1) window.scrollTo({ top: 0, behavior: "smooth" });
      }
      draw();
    }
  };

  /* ============ 2 & 4. LỊCH THÁNG / CHỌN NGƯỜI PHỤ TRÁCH ============ */
  function pickerFlow(host, withStaff) {
    const st = { staffId: null, serviceId: C.services[0].id, date: null, time: null };
    function drawStaff() {
      host.innerHTML = `<div class="hero slim"><h1>Chọn ${esc(lbl())} của bạn</h1><p>Mỗi ${esc(lbl())} có lịch trống riêng</p></div>
        <div class="staff-grid">${C.staff.map(p => `<button class="scard" data-id="${p.id}">
          <span class="avatar">${p.emoji}</span><b>${esc(p.name)}</b><small>${esc(p.role)}</small>
          <span class="srow">${p.rating ? `<span class="star">★ ${p.rating.toFixed(1)}</span>` : "<span></span>"}<span class="next">Gần nhất: ${esc(nextFree(p.id))}</span></span>
          <span class="pickme">Chọn ${esc(p.name)}</span></button>`).join("")}</div>`;
      $$(".scard", host).forEach(b => b.onclick = () => { st.staffId = b.dataset.id; st.date = st.time = null; drawMain(); });
    }
    function drawMain() {
      const p = withStaff && BK.staffOf(st.staffId);
      host.innerHTML = `<div class="hero slim"><h1>${withStaff ? "Chọn ngày &amp; giờ" : "Chọn ngày trên lịch"}</h1><p>Chấm màu cho biết ngày còn nhiều hay ít chỗ trống</p></div>
        ${p ? `<div class="staff-head"><span class="avatar sm">${p.emoji}</span><div><b>${esc(p.name)}</b><small>${esc(p.role)}</small></div><button class="link" id="chg">Đổi ${esc(lbl())}</button></div>` : ""}
        <div class="panel"><div class="picker"><div id="cal"></div>
          <div><div id="slots"></div>
            <div id="more" hidden>
              <div class="slots-title" style="margin-top:20px">Dịch vụ</div><div class="pills" id="pills"></div>
              <form id="f" novalidate style="margin-top:14px">${BK.formHTML()}<button class="btn primary block" type="submit">Xác nhận đặt lịch</button></form>
            </div></div></div></div>`;
      const more = q(host, "#more");
      const pills = () => { q(host, "#pills").innerHTML = C.services.map(s => `<button type="button" class="pill ${s.id === st.serviceId ? "is-sel" : ""}" data-id="${s.id}">${s.icon} ${esc(s.name)} <small>${money(s.price)}</small></button>`).join(""); $$(".pill", host).forEach(b => b.onclick = () => { st.serviceId = b.dataset.id; pills(); }); };
      const staff = () => st.staffId;
      const cal = BK.mountCalendar(q(host, "#cal"), { sel: () => st.date, staff, pick: d => { st.date = d; st.time = null; more.hidden = true; cal.render(); slots.render(); } });
      const slots = BK.mountSlots(q(host, "#slots"), { date: () => st.date, sel: () => st.time, staff, pick: t => { st.time = t; slots.render(); more.hidden = false; pills(); more.scrollIntoView({ behavior: "smooth", block: "nearest" }); } });
      if (p) q(host, "#chg").onclick = drawStaff;
      q(host, "#f").onsubmit = e => {
        e.preventDefault(); const d = BK.readForm(e.target); if (!d) return;
        const b = BK.create({ ...st, ...d });
        if (b) BK.showDone(host, b); else { st.time = null; more.hidden = true; slots.render(); cal.render(); }
      };
    }
    withStaff ? drawStaff() : drawMain();
  }
  F.calendar = { mount: host => pickerFlow(host, false) };
  F.staff = { mount: host => pickerFlow(host, true) };

  /* ============ 3. MỘT TRANG ============ */
  F.onepage = {
    mount(host, BK, opts) {
      const st = { serviceId: opts.serviceId || null, date: null, time: null };
      host.innerHTML = `<div class="hero slim"><h1>Đặt lịch nhanh</h1><p>Điền một lần, xác nhận ngay bên phải</p></div>
        <div class="op"><div class="op-main">
          <section class="panel"><h3><span class="n">1</span>Chọn dịch vụ</h3><div class="services" id="svc"></div></section>
          <section class="panel"><h3><span class="n">2</span>Chọn ngày &amp; giờ</h3><div id="strip"></div><div id="slots" style="margin-top:14px"></div></section>
          <section class="panel"><h3><span class="n">3</span>Thông tin của bạn</h3><form id="f" novalidate>${BK.formHTML()}</form></section>
        </div>
        <aside class="op-side"><div class="panel sticky"><h3>Tóm tắt đặt lịch</h3><ul class="sum" id="sum"></ul><div class="total" id="total"></div>
          <button class="btn primary block" id="ok" type="submit" form="f">Xác nhận đặt lịch</button></div></aside></div>`;
      const sum = () => {
        const s = st.serviceId && BK.svc(st.serviceId), row = (k, v) => `<li class="${v ? "ok" : ""}"><span>${k}</span><b>${v || "Chưa chọn"}</b></li>`;
        q(host, "#sum").innerHTML = row("Dịch vụ", s && esc(s.name)) + row("Ngày", st.date && fmtDate(st.date)) + row("Giờ", st.time);
        q(host, "#total").innerHTML = s ? `<span>Tạm tính</span><b>${money(s.price)}</b>` : "";
        q(host, "#ok").disabled = !(s && st.date && st.time);
      };
      const drawSvc = () => { q(host, "#svc").innerHTML = svcCards(st.serviceId); $$(".svc", host).forEach(b => b.onclick = () => { st.serviceId = b.dataset.id; drawSvc(); sum(); }); };
      const strip = BK.mountStrip(q(host, "#strip"), { sel: () => st.date, pick: d => { st.date = d; st.time = null; strip.render(); slots.render(); sum(); } });
      const slots = BK.mountSlots(q(host, "#slots"), { date: () => st.date, sel: () => st.time, pick: t => { st.time = t; slots.render(); sum(); } });
      q(host, "#f").onsubmit = e => {
        e.preventDefault(); if (q(host, "#ok").disabled) return BK.toast("Vui lòng chọn dịch vụ, ngày và giờ");
        const d = BK.readForm(e.target); if (!d) return;
        const b = BK.create({ ...st, ...d });
        if (b) BK.showDone(host, b); else { st.time = null; slots.render(); sum(); }
      };
      drawSvc(); sum();
    }
  };

  /* ============ 5. TRÒ CHUYỆN ============ */
  F.chat = {
    mount(host) {
      host.innerHTML = `<div class="hero slim"><h1>Đặt lịch qua trò chuyện</h1><p>Trả lời vài câu hỏi ngắn là xong</p></div>
        <div class="panel chat"><div class="chat-log" id="log"></div><form class="chat-in" id="inp" hidden><input id="ti" autocomplete="off"><button class="btn primary" type="submit">Gửi</button></form></div>`;
      const log = q(host, "#log"), bar = q(host, "#inp"), ti = q(host, "#ti");
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const scroll = () => log.lastElementChild && log.lastElementChild.scrollIntoView({ behavior: "smooth", block: "end" });
      const stop = () => { if (!log.isConnected) throw new Error("abort"); };
      async function bot(html) {
        stop(); const el = document.createElement("div"); el.className = "msg bot"; el.innerHTML = `<span class="typing"><i></i><i></i><i></i></span>`;
        log.append(el); scroll(); await sleep(550); stop(); el.innerHTML = html; scroll();
      }
      function user(text) { const el = document.createElement("div"); el.className = "msg me"; el.textContent = text; log.append(el); scroll(); }
      function choices(items, pageSize = 6) {
        return new Promise(res => {
          let shown = 0; const row = document.createElement("div"); row.className = "msg chips"; log.append(row);
          const draw = () => {
            shown = Math.min(items.length, shown + pageSize);
            row.innerHTML = items.slice(0, shown).map((it, i) => `<button type="button" class="qr" data-i="${i}">${it.l}</button>`).join("") +
              (shown < items.length ? `<button type="button" class="qr more">Xem thêm…</button>` : "");
            $$(".qr", row).forEach(b => b.onclick = () => { if (b.classList.contains("more")) { draw(); scroll(); return; } const it = items[+b.dataset.i]; row.remove(); user(it.u || it.l.replace(/<[^>]+>/g, "")); res(it.v); });
          };
          draw(); scroll();
        });
      }
      function ask(placeholder, mode, check) {
        return new Promise(res => {
          bar.hidden = false; ti.value = ""; ti.placeholder = placeholder; ti.inputMode = mode; ti.focus();
          bar.onsubmit = e => {
            e.preventDefault(); const v = ti.value.trim(), err = check(v);
            if (err) { ti.classList.add("bad"); ti.placeholder = err; ti.value = ""; return; }
            ti.classList.remove("bad"); bar.hidden = true; user(v); res(v);
          };
        });
      }
      async function run() {
        try {
          log.innerHTML = "";
          await bot(`Xin chào 👋 Mình là trợ lý đặt lịch của <b>${esc(C.brand.name)}</b>.`);
          await bot("Bạn muốn đặt dịch vụ nào?");
          const sid = await choices(C.services.map(s => ({ v: s.id, l: `${s.icon} ${esc(s.name)} · ${money(s.price)}` })), 4);
          const s = BK.svc(sid);
          await bot(`Tuyệt! <b>${esc(s.name)}</b> kéo dài khoảng ${s.minutes} phút. Bạn muốn đến vào ngày nào?`);
          const days = [];
          for (let i = 0; i < 60 && days.length < 18; i++) {
            const d = new Date(today().getFullYear(), today().getMonth(), today().getDate() + i), k = iso(d);
            if (BK.dayOpen(d) && BK.freeCount(k) > 0) days.push({ v: k, l: `${i === 0 ? "Hôm nay" : i === 1 ? "Ngày mai" : BK.DOW_S[d.getDay()]} · ${d.getDate()}/${d.getMonth() + 1}` });
          }
          const date = await choices(days, 6);
          await bot(`Ngày ${fmtDate(date)} còn các giờ này, bạn chọn giờ nhé:`);
          const times = BK.slotsFor().filter(t => !BK.isPast(date, t) && !BK.isTaken(date, t)).map(t => ({ v: t, l: t }));
          const time = await choices(times, 8);
          await bot("Sắp xong rồi! Cho mình xin <b>họ tên</b> của bạn?");
          const name = await ask("Nhập họ tên…", "text", v => v.length < 2 ? "Vui lòng nhập họ tên" : "");
          await bot(`Cảm ơn ${esc(name)}. Số <b>điện thoại</b> của bạn là gì?`);
          const phone = await ask("Nhập số điện thoại…", "tel", v => /^0\d{9}$/.test(BK.digits(v)) ? "" : "Số gồm 10 chữ số, bắt đầu bằng 0");
          const draft = { serviceId: sid, date, time, name, phone: BK.digits(phone) };
          await bot(`Mình xác nhận lại nhé:<div class="summary" style="margin:8px 0 0">${BK.summaryHTML(draft)}</div>`);
          const ok = await choices([{ v: 1, l: "✅ Xác nhận đặt lịch" }, { v: 0, l: "✏️ Làm lại từ đầu" }]);
          if (!ok) return run();
          const b = BK.create(draft);
          if (b) BK.showDone(host, b); else { await bot("Rất tiếc, khung giờ đó vừa có người đặt. Mình chọn lại nhé!"); return run(); }
        } catch (e) { if (e.message !== "abort") throw e; }
      }
      run();
    }
  };

  /* ============ ĐỔI NGÀY (dùng từ "Lịch của tôi") ============ */
  F.reschedule = {
    mount(host, BK, opts) {
      const b = BK.bookings.find(x => x.id === opts.id); if (!b) return BK.go("manage");
      const st = { date: null, time: null }, s = BK.svc(b.serviceId), oldDate = parse(b.date);
      host.innerHTML = `<div class="hero slim"><h1>Đổi ngày hẹn</h1><p>Chọn ngày và giờ mới, mọi thông tin khác được giữ nguyên</p></div>
        <div class="panel"><div class="resched-now"><span class="muted">Lịch hiện tại</span><div class="summary">${BK.summaryHTML(b)}</div></div>
          <div class="picker"><div id="cal"></div><div id="slots"></div></div>
          <div class="actions"><button class="btn ghost" id="keep">Giữ lịch cũ</button><button class="btn primary" id="ok" disabled>Xác nhận đổi lịch</button></div></div>`;
      const cal = BK.mountCalendar(q(host, "#cal"), { month: oldDate < today() ? today() : oldDate, current: b.date, sel: () => st.date, staff: b.staffId, ignore: b.id,
        pick: d => { st.date = d; st.time = null; cal.render(); slots.render(); ok.disabled = true; } });
      const slots = BK.mountSlots(q(host, "#slots"), { date: () => st.date, sel: () => st.time, staff: b.staffId, ignore: b.id, pick: t => { st.time = t; slots.render(); ok.disabled = false; } });
      const ok = q(host, "#ok");
      q(host, "#keep").onclick = () => BK.go("manage");
      ok.onclick = () => {
        if (BK.isTaken(st.date, st.time, b.staffId, b.id) || BK.isPast(st.date, st.time)) { BK.toast("Khung giờ vừa được đặt, vui lòng chọn giờ khác"); st.time = null; slots.render(); ok.disabled = true; return; }
        const old = { date: b.date, time: b.time };
        b.date = st.date; b.time = st.time; BK.save(); $("#searchInput").value = b.phone;
        BK.go("manage");
        BK.toast(`Đã đổi sang ${fmtDate(b.date)}, ${b.time}`, { label: "Hoàn tác", fn: () => { b.date = old.date; b.time = old.time; BK.save(); BK.renderResults(); BK.toast("Đã khôi phục lịch cũ"); } });
      };
    }
  };
})();
