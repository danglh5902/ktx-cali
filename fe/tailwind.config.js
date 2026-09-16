/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Bảng màu trạng thái riêng cho giường/phòng — docs/15 §5:
        // "không dùng chung với màu biểu đồ", luôn kèm ký hiệu + nhãn chữ.
        bed: {
          available: "#16a34a",
          occupied: "#2563eb",
          reserved: "#f59e0b",
          checkoutPending: "#a855f7",
          cleaning: "#0891b2",
          maintenance: "#dc2626",
          blocked: "#525252",
        },
      },
    },
  },
  plugins: [],
};
