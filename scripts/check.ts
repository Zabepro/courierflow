import { PrismaClient } from "../lib/generated/prisma/client";
import { config } from "dotenv";

config({ path: "../.env" }); // Load from project root

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: "issamchowera02@gmail.com" }
  });
  console.log("Found:", users.length);
  
  const del = await prisma.user.deleteMany({
    where: { email: "issamchowera02@gmail.com" }
  });
  console.log("Deleted count:", del.count);
}
main().finally(() => process.exit(0));
