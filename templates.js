// Thêm mẫu mới: thêm một object vào THEMES (kèm khối [data-theme="id"] trong style.css)
// hoặc vào INDUSTRIES (chỉ cần khai báo dữ liệu).
window.THEMES = [
  { id: "indigo",  name: "Hiện đại",   desc: "Sáng, tím indigo, bo góc lớn",   sw: ["#6366f1", "#f6f7fb", "#ffffff"] },
  { id: "minimal", name: "Tối giản",   desc: "Đen trắng, chữ serif, góc vuông", sw: ["#111111", "#fafaf7", "#ffffff"] },
  { id: "sunset",  name: "Ấm áp",      desc: "Cam hồng, mềm mại, thân thiện",  sw: ["#f97316", "#fff7f0", "#ffffff"] },
  { id: "forest",  name: "Tự nhiên",   desc: "Xanh lá dịu, cảm giác thư giãn", sw: ["#15803d", "#f3f7f2", "#ffffff"] },
  { id: "glass",   name: "Glass tối",  desc: "Nền tối, hiệu ứng kính mờ",      sw: ["#8b5cf6", "#0b0b1a", "#1e1b3a"] }
];

window.INDUSTRIES = [
  {
    id: "general", name: "Chung", icon: "✨",
    brand: { name: "Lumio Studio", tagline: "Đặt lịch chỉ trong 1 phút", emoji: "✨" },
    services: [
      { id: "s1", name: "Tư vấn ban đầu", desc: "Trao đổi nhu cầu, định hướng phù hợp", minutes: 30, price: 0, icon: "💬" },
      { id: "s2", name: "Dịch vụ tiêu chuẩn", desc: "Gói phổ biến nhất, phù hợp đa số khách", minutes: 60, price: 350000, icon: "⭐" },
      { id: "s3", name: "Dịch vụ cao cấp", desc: "Chăm sóc kỹ lưỡng, thời gian dài hơn", minutes: 90, price: 590000, icon: "💎" },
      { id: "s4", name: "Tái khám / Bảo dưỡng", desc: "Dành cho khách đã sử dụng dịch vụ", minutes: 30, price: 150000, icon: "🔁" }
    ]
  },
  {
    id: "spa", name: "Spa & Salon", icon: "💆",
    brand: { name: "Lotus Spa & Beauty", tagline: "Thư giãn trọn vẹn — đặt lịch dễ dàng", emoji: "🪷" },
    services: [
      { id: "s1", name: "Massage body thư giãn", desc: "Massage tinh dầu toàn thân", minutes: 60, price: 450000, icon: "💆" },
      { id: "s2", name: "Chăm sóc da mặt", desc: "Làm sạch, dưỡng ẩm, đắp mặt nạ", minutes: 75, price: 390000, icon: "🧖" },
      { id: "s3", name: "Cắt & tạo kiểu tóc", desc: "Tư vấn kiểu tóc hợp khuôn mặt", minutes: 60, price: 250000, icon: "💇" },
      { id: "s4", name: "Nail & Spa tay chân", desc: "Sơn gel, chăm sóc móng", minutes: 90, price: 320000, icon: "💅" }
    ]
  },
  {
    id: "clinic", name: "Phòng khám", icon: "🩺",
    brand: { name: "Nha Khoa An Tâm", tagline: "Đặt lịch khám nhanh, không phải chờ đợi", emoji: "🦷" },
    services: [
      { id: "s1", name: "Khám tổng quát", desc: "Kiểm tra răng miệng, tư vấn điều trị", minutes: 30, price: 0, icon: "🩺" },
      { id: "s2", name: "Lấy cao răng", desc: "Làm sạch cao răng và đánh bóng", minutes: 30, price: 200000, icon: "🪥" },
      { id: "s3", name: "Tẩy trắng răng", desc: "Công nghệ tẩy trắng an toàn", minutes: 60, price: 1500000, icon: "😁" },
      { id: "s4", name: "Niềng răng – tư vấn", desc: "Đánh giá và lên phác đồ chỉnh nha", minutes: 45, price: 0, icon: "📋" }
    ]
  },
  {
    id: "restaurant", name: "Nhà hàng", icon: "🍽️",
    brand: { name: "Bếp Nhà Sài Gòn", tagline: "Giữ bàn trước — bữa ăn trọn vẹn", emoji: "🍜" },
    services: [
      { id: "s1", name: "Bàn 2 người", desc: "Phù hợp buổi hẹn hò", minutes: 90, price: 0, icon: "🥂" },
      { id: "s2", name: "Bàn 4–6 người", desc: "Gia đình hoặc nhóm bạn", minutes: 120, price: 0, icon: "🍽️" },
      { id: "s3", name: "Phòng riêng (8–12)", desc: "Tiệc nhỏ, họp mặt công ty", minutes: 150, price: 500000, icon: "🎉" },
      { id: "s4", name: "Set menu đặt trước", desc: "Menu 5 món do bếp trưởng chọn", minutes: 120, price: 690000, icon: "👨‍🍳" }
    ]
  }
];

// Người phụ trách theo ngành (dùng cho kiểu "Chọn chuyên viên"). Với nhà hàng, đây là khu vực chỗ ngồi.
const STAFF_BY_INDUSTRY = {
  general: { staffLabel: "Chuyên viên", staff: [
    { id: "p1", name: "Minh Anh", role: "Chuyên viên cấp cao · 8 năm kinh nghiệm", emoji: "👩‍💼", rating: 4.9 },
    { id: "p2", name: "Quốc Bảo", role: "Chuyên viên tư vấn", emoji: "👨‍💼", rating: 4.8 },
    { id: "p3", name: "Thu Hà", role: "Chuyên viên · thân thiện, tận tâm", emoji: "🧑‍💼", rating: 4.7 }
  ] },
  spa: { staffLabel: "Kỹ thuật viên", staff: [
    { id: "p1", name: "Ngọc Lan", role: "Chuyên massage & trị liệu", emoji: "🧖‍♀️", rating: 5.0 },
    { id: "p2", name: "Thảo My", role: "Chuyên chăm sóc da", emoji: "💆‍♀️", rating: 4.9 },
    { id: "p3", name: "Hoàng Nam", role: "Stylist tóc & nail", emoji: "💇‍♂️", rating: 4.8 }
  ] },
  clinic: { staffLabel: "Bác sĩ", staff: [
    { id: "p1", name: "BS. Trần Minh", role: "Nha khoa tổng quát · 12 năm", emoji: "👨‍⚕️", rating: 4.9 },
    { id: "p2", name: "BS. Lê Thu Trang", role: "Chỉnh nha – niềng răng", emoji: "👩‍⚕️", rating: 4.9 },
    { id: "p3", name: "BS. Phạm Đức", role: "Phục hình & cấy ghép", emoji: "🧑‍⚕️", rating: 4.8 }
  ] },
  restaurant: { staffLabel: "Khu vực", staff: [
    { id: "p1", name: "Trong nhà", role: "Máy lạnh, yên tĩnh, phù hợp gia đình", emoji: "🏠" },
    { id: "p2", name: "Sân vườn", role: "Thoáng mát, có cây xanh", emoji: "🌿" },
    { id: "p3", name: "Rooftop tầng 5", role: "View thành phố, không gian lãng mạn", emoji: "🌇" }
  ] }
};
INDUSTRIES.forEach(i => Object.assign(i, STAFF_BY_INDUSTRY[i.id]));

// ---- Ngành NAIL (kèm giao diện "rose" riêng) ----
THEMES.splice(1, 0, { id: "rose", name: "Nail hồng", desc: "Hồng pastel bóng bẩy, dành cho nail & beauty", sw: ["#ec4899", "#fff4f8", "#ffffff"] });
INDUSTRIES.splice(1, 0, {
  id: "nail", name: "Nail", icon: "💅", theme: "rose",
  brand: { name: "Pinky Nail Studio", tagline: "Đặt lịch làm móng — xinh chỉ với vài cú chạm", emoji: "💅" },
  services: [
    { id: "s1", name: "Sơn gel cơ bản", desc: "Làm sạch, dũa form, sơn gel bền màu", minutes: 45, price: 150000, icon: "💅" },
    { id: "s2", name: "Úp / đắp móng gel", desc: "Nối móng, tạo form dáng mong muốn", minutes: 90, price: 350000, icon: "✨" },
    { id: "s3", name: "Nail art thiết kế", desc: "Vẽ, đính đá, mắt mèo, tráng gương", minutes: 120, price: 450000, icon: "🎨" },
    { id: "s4", name: "Spa tay & chân", desc: "Ngâm, tẩy da chết, dưỡng ẩm, massage", minutes: 75, price: 280000, icon: "🌸" },
    { id: "s5", name: "Tháo móng & chăm sóc", desc: "Tháo gel an toàn, phục hồi móng yếu", minutes: 30, price: 80000, icon: "🧴" }
  ],
  staffLabel: "Thợ nail",
  staff: [
    { id: "p1", name: "Bé Ly", role: "Nail artist · chuyên vẽ & đính đá", emoji: "👩‍🎨", rating: 5.0 },
    { id: "p2", name: "Tú Anh", role: "Chuyên úp móng, form dáng đẹp", emoji: "💁‍♀️", rating: 4.9 },
    { id: "p3", name: "Mai Chi", role: "Chuyên spa tay chân, nhẹ nhàng", emoji: "🧖‍♀️", rating: 4.8 }
  ],
  palette: [
    { n: "Hồng sữa", c: "#f9c5d1" }, { n: "Đỏ cherry", c: "#c1121f" }, { n: "Nude kem", c: "#e8c4a8" },
    { n: "Tím lavender", c: "#c4b5fd" }, { n: "Xanh mint", c: "#a7f3d0" }, { n: "Mắt mèo", c: "#5b3a7a" },
    { n: "Trắng sữa", c: "#fdf6ee" }, { n: "Chrome bạc", c: "#cfd3da" }
  ]
});
