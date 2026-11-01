const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const {
  seedMasterLabTemplates,
  syncTemplatesToAllHospitals,
  syncTemplatesToHospital,
} = require("../services/labCatalogService");

const getArgValue = (flag) => {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) {
    return "";
  }

  return process.argv[index + 1];
};

async function seedLabTests() {
  const hospitalIdArg = getArgValue("--hospital-id");
  const hospitalId = hospitalIdArg ? Number(hospitalIdArg) : null;

  if (hospitalIdArg && (!Number.isInteger(hospitalId) || hospitalId <= 0)) {
    throw new Error("Expected --hospital-id to be a positive integer");
  }

  console.log("Seeding master lab test templates...");
  await seedMasterLabTemplates();

  if (hospitalId) {
    console.log(`Syncing lab templates to hospital ${hospitalId}...`);
    await syncTemplatesToHospital(hospitalId);
  } else {
    console.log("Syncing lab templates to all hospitals...");
    await syncTemplatesToAllHospitals();
  }

  console.log("Lab catalog seed complete.");
}

seedLabTests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Lab catalog seed failed:", error);
    process.exit(1);
  });
