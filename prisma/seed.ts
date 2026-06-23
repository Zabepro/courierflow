import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter } as never);

async function main() {
  const org = await (prisma as unknown as { organization: { upsert: (args: unknown) => Promise<{ id: string; slug: string }> } }).organization.upsert({
    where:  { slug: "courierflow-tz" },
    update: {},
    create: {
      name:    "CourierFlow Tanzania",
      slug:    "courierflow-tz",
      city:    "Dar es Salaam",
      phone:   "+255700000000",
      country: "Tanzania",
    },
  });

  console.log("✅ Organization imeundwa:", org.slug, `(ID: ${org.id})`);
  console.log("\n📌 Hatua zinazofuata:");
  console.log("   1. Nenda http://localhost:3000");
  console.log("   2. Ingia na Clerk");
  console.log("   3. Bonyeza 'Setup Dev Environment' kwenye dashboard");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await pool.end(); });
