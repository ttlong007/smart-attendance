import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Đang xóa dữ liệu cũ...');
  await prisma.attendance.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  console.log('🏢 Đang tạo 100 chi nhánh tại TP.HCM...');
  const hcmcDistricts = [
    'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 10', 
    'Quận 11', 'Quận 12', 'Bình Tân', 'Bình Thạnh', 'Gò Vấp', 'Phú Nhuận', 'Tân Bình', 
    'Tân Phú', 'Thủ Đức', 'Bình Chánh', 'Cần Giờ', 'Củ Chi', 'Hóc Môn', 'Nhà Bè'
  ];

  const branches = [];
  for (let i = 1; i <= 100; i++) {
    const district = hcmcDistricts[Math.floor(Math.random() * hcmcDistricts.length)];
    const branch = await prisma.branch.create({
      data: {
        name: `Chi nhánh ${district} - ${i}`,
        address: `${i} Đường số ${Math.floor(Math.random() * 100) + 1}, ${district}, TP.HCM`,
        latitude: 10.7 + (Math.random() - 0.5) * 0.2,
        longitude: 106.6 + (Math.random() - 0.5) * 0.2,
        radius: 100,
        allowedWifiSsid: `HDBank_Branch_${i}`,
        allowedWifiBssid: `00:11:22:33:44:${i.toString(16).padStart(2, '0')}`,
        allowedPublicIp: i % 10 === 0 ? "127.0.0.1" : `146.70.1.${i}`, // Mock IPs for demo
      },
    });
    branches.push(branch);
  }
  console.log(`✅ Đã tạo ${branches.length} chi nhánh.`);

  console.log('👤 Đang tạo 5.000 nhân viên (chia batch để tối ưu)...');
  const totalStaff = 5000;
  const batchSize = 1000;
  const numBatches = totalStaff / batchSize;

  for (let b = 0; b < numBatches; b++) {
    const usersBatch = [];
    for (let i = 1; i <= batchSize; i++) {
      const staffIdx = b * batchSize + i;
      const branch = branches[Math.floor(Math.random() * branches.length)];
      
      let role: 'ADMIN' | 'MANAGER' | 'STAFF' = 'STAFF';
      if (staffIdx <= 10) role = 'ADMIN';
      else if (staffIdx <= 100) role = 'MANAGER';

      usersBatch.push({
        name: `Nhân viên ${staffIdx}`,
        email: `staff${staffIdx}@hdbank.com.vn`,
        password: "$2b$10$e4zxruccbPCtNsEewYn5QeyAXyvbgELiWYzcvIKg5Ywof8xWPlaEu", // "123456"
        role: role,
        branchId: branch.id,
      });
    }
    await prisma.user.createMany({ data: usersBatch });
    console.log(`📦 Đã xong batch ${b + 1}/${numBatches} (1.000 nhân viên).`);
  }

  console.log('📝 Đang tạo 50 bản ghi chấm công mẫu cho hôm nay...');
  // Lấy danh sách ID nhân viên đã tạo
  const allUsers = await prisma.user.findMany({ 
    take: 100, 
    select: { id: true, branchId: true } 
  });
  
  const attendanceRecords = [];
  const statuses = ['ON_TIME', 'LATE', 'LATE', 'ON_TIME', 'ON_TIME'];
  
  for (let i = 0; i < 50; i++) {
    const user = allUsers[Math.floor(Math.random() * allUsers.length)];
    const branch = branches.find(b => b.id === user.branchId) || branches[0];
    
    // Giờ check-in ngẫu nhiên từ 7:30 - 9:30 sáng nay
    const checkIn = new Date();
    checkIn.setHours(7, 30 + Math.floor(Math.random() * 120), 0, 0);

    attendanceRecords.push({
      userId: user.id,
      branchId: branch.id as string,
      checkIn: checkIn,
      checkOut: Math.random() > 0.6 ? new Date() : null,
      lat: branch.latitude + (Math.random() - 0.5) * 0.001,
      lng: branch.longitude + (Math.random() - 0.5) * 0.001,
      wifiSsid: branch.allowedWifiSsid,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      isVerified: true,
    });
  }

  await prisma.attendance.createMany({ data: attendanceRecords });
  console.log('✅ Đã tạo 50 bản ghi chấm công.');

  console.log('✨ HOÀN TẤT SEED DỮ LIỆU!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
