import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Finding dummy attendance records...');
  
  // Find "Nhân viên 101" to keep their records
  const user101 = await prisma.user.findFirst({
    where: { name: 'Nhân viên 101' }
  });

  if (!user101) {
    console.log("Could not find Nhân viên 101.");
  } else {
    console.log(`Nhân viên 101 found with ID: ${user101.id}`);
  }

  // Find users seeded as dummy records that we want to delete
  // Or simply delete all attendance NOT belonging to user 101.
  
  const deleted = await prisma.attendance.deleteMany({
    where: {
      userId: {
        not: user101?.id
      }
    }
  });

  console.log(`Deleted ${deleted.count} dummy attendance records.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
