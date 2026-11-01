const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { seedMasterLabTemplates, syncTemplatesToAllHospitals } = require("../services/labCatalogService");

async function main() {
  await seedMasterLabTemplates();
  await syncTemplatesToAllHospitals();
  console.log("Prisma seed complete: master lab templates seeded and synced to hospitals.");
}

main().catch((error) => {
  console.error("Prisma seed failed:", error.message);
  process.exit(1);
});
