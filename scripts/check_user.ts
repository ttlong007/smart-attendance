import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "longtt7@hdbank.com.vn";
  const user = await prisma.user.findUnique({
    where: { email },
    include: { branch: true }
  });

  if (user) {
    console.log("USER_FOUND:" + JSON.stringify(user, null, 2));
  } else {
    console.log("USER_NOT_FOUND");
    
    // Also check total count
    const count = await prisma.user.count();
    console.log("TOTAL_USERS:" + count);

    // List latest 5 users
    const latest = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" }
    });
    console.log("LATEST_USERS:" + JSON.stringify(latest, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
