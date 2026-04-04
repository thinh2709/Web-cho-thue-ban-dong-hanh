import Pricing from '../src/models/Pricing.js';
import Booking from '../src/models/Booking.js';

const pricingDocuments = [
  {
    packageName: 'Đi cafe',
    price: 400_000,
    maxPrice: 800_000,
    unit: 'buổi',
    category: 'basic',
    isPublic: true,
    description: 'Dịch vụ đồng hành đi cafe, trò chuyện thư giãn.',
  },
  {
    packageName: 'Đi ăn uống',
    price: 500_000,
    maxPrice: 1_000_000,
    unit: 'buổi',
    category: 'basic',
    isPublic: true,
    description: 'Đồng hành bữa ăn tại nhà hàng hoặc quán.',
  },
  {
    packageName: 'Dạo phố',
    price: 450_000,
    maxPrice: 900_000,
    unit: 'buổi',
    category: 'basic',
    isPublic: true,
    description: 'Dạo phố, shopping hoặc tham quan trong thành phố.',
  },
  {
    packageName: 'Tham gia sự kiện',
    price: 1_000_000,
    maxPrice: 3_000_000,
    unit: 'buổi',
    category: 'premium',
    isPublic: true,
    description: 'Đồng hành sự kiện, tiệc hoặc hội nghị.',
  },
];

/**
 * Sinh mốc thời gian trong 6 tháng gần nhất (theo múi giờ local server).
 */
function sixMonthsWindow() {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - 6);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function atHour(d, h, m = 0) {
  const x = new Date(d);
  x.setHours(h, m, 0, 0);
  return x;
}

/**
 * 25 booking completed, trải 6 tháng; 3 giao dịch gần nhất đúng tên & số tiền mẫu thiết kế.
 */
function buildBookingDocuments() {
  const { start, end } = sixMonthsWindow();
  const spanDays = Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)));

  const sampleNames = [
    'Phạm Quỳnh Anh',
    'Hoàng Đức Anh',
    'Vũ Mai Linh',
    'Đặng Gia Huy',
    'Bùi Thảo My',
    'Phan Hải Đăng',
    'Đỗ Minh Châu',
    'Ngô Bảo Ngọc',
    'Lý Quang Vinh',
    'Hồ Khánh Vy',
    'Trương Đình Phúc',
    'Mai Thuỳ Dung',
    'Võ Anh Khoa',
    'Dương Bích Ngân',
    'Lương Tuấn Kiệt',
    'Chu Diệu Hương',
    'Tôn Gia Bảo',
    'Hà Minh Khôi',
    'Kiều Lan Anh',
    'Cao Thế Vinh',
  ];

  const amountsPool = [
    420_000, 480_000, 550_000, 600_000, 650_000, 720_000, 780_000, 850_000, 920_000, 1_050_000,
    1_200_000, 1_350_000, 1_500_000, 1_800_000, 2_100_000, 2_400_000, 2_800_000,
  ];

  const bookings = [];

  // Giao dịch gần đây (theo thiết kế Figma — số tiền làm tròn điển hình)
  bookings.push({
    customerName: 'Lê Hoàng Nam',
    amount: 1_200_000,
    status: 'completed',
    completedAt: atHour(addDays(end, -1), 18, 30),
    rating: 5,
    durationHours: 4,
  });
  bookings.push({
    customerName: 'Nguyễn Thu Hà',
    amount: 800_000,
    status: 'completed',
    completedAt: atHour(addDays(end, -2), 14, 15),
    rating: 4.5,
    durationHours: 3,
  });
  bookings.push({
    customerName: 'Trần Minh Tuấn',
    amount: 650_000,
    status: 'completed',
    completedAt: atHour(addDays(end, -3), 10, 0),
    rating: 5,
    durationHours: 2.5,
  });

  let nameIdx = 0;
  const extra = 25 - bookings.length;
  for (let k = 0; k < extra; k += 1) {
    const phase = extra > 1 ? k / (extra - 1) : 0;
    const dayOffset = Math.min(Math.floor(phase * Math.max(1, spanDays - 2)) + (k % 5), spanDays - 1);
    const baseDay = addDays(start, dayOffset);
    const completedAt = atHour(baseDay, 9 + (k % 8), (k * 11) % 60);

    bookings.push({
      customerName: sampleNames[nameIdx % sampleNames.length],
      amount: amountsPool[k % amountsPool.length],
      status: 'completed',
      completedAt,
      rating: Math.round((3.5 + (k % 15) / 10) * 10) / 10,
      durationHours: Math.round((1 + (k % 6) * 0.5) * 10) / 10,
    });
    nameIdx += 1;
  }

  // Đảm bảo mọi completedAt nằm trong [start, end]
  bookings.forEach((b) => {
    if (b.completedAt < start) b.completedAt = new Date(start.getTime() + 60 * 60 * 1000);
    if (b.completedAt > end) b.completedAt = new Date(end.getTime() - 60 * 60 * 1000);
  });

  return bookings;
}

export async function seedDatabase() {
  await Pricing.deleteMany({});
  await Booking.deleteMany({});

  await Pricing.insertMany(pricingDocuments);
  await Booking.insertMany(buildBookingDocuments());

  console.log('[seed] Đã làm mới dữ liệu mẫu: Pricing + Booking (development).');
}
