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
