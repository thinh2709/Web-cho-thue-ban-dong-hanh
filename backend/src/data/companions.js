/** Danh sách tĩnh cho trang chủ & yêu thích (JSON store), khớp id dùng ở FE. */
export const companions = [
  {
    id: "c1",
    name: "Nguyễn Thị Lan",
    location: "Hà Nội",
    avatar: "👩",
    tags: ["Du lịch", "Ẩm thực"],
    rating: 4.9,
    reviewCount: 128,
    pricePerHour: 500000,
    online: true,
  },
  {
    id: "c2",
    name: "Trần Văn Minh",
    location: "TP. HCM",
    avatar: "👨",
    tags: ["Thể thao", "Âm nhạc"],
    rating: 4.8,
    reviewCount: 96,
    pricePerHour: 600000,
    online: false,
  },
  {
    id: "c3",
    name: "Lê Thị Hương",
    location: "Đà Nẵng",
    avatar: "👩",
    tags: ["Cafe", "Đọc sách"],
    rating: 4.7,
    reviewCount: 84,
    pricePerHour: 450000,
    online: true,
  },
  {
    id: "c4",
    name: "Phạm Hoàng Nam",
    location: "Hà Nội",
    avatar: "👨",
    tags: ["Gaming", "Phim ảnh"],
    rating: 4.9,
    reviewCount: 156,
    pricePerHour: 550000,
    online: false,
  },
];

export function getCompanionById(id) {
  return companions.find((c) => c.id === id) ?? null;
}
