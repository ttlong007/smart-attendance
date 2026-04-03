import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Searching for 'Nhân viên 101'...");
  const user = await prisma.user.findFirst({
    where: { 
      OR: [
        { name: { contains: "101" } },
        { id: "101" }
      ]
    },
    include: { branch: true }
  });

  if (user) {
    console.log("Found User:", JSON.stringify(user, null, 2));
    if (user.branch) {
      console.log("Branch Info:", JSON.stringify(user.branch, null, 2));
    } else {
      console.log("User has no branch assigned.");
    }
  } else {
    // try all users to find which one
    const allUsers = await prisma.user.findMany({ select: { name: true, email: true } });
    console.log("User not found by '101'. All users available:", allUsers);
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
