const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === "--username" && next) parsed.username = next;
    if (current === "--password" && next) parsed.password = next;
    if (current === "--phone" && next) parsed.phone = next;
  }

  return parsed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const username = args.username || process.env.SUPERADMIN_USERNAME;
  const password = args.password || process.env.SUPERADMIN_PASSWORD;
  const phone = args.phone || process.env.SUPERADMIN_PHONE || null;

  if (!username || !password) {
    console.error(
      "Usage: node scripts/create-superadmin.js --username <username> --password <password> [--phone <phone>]"
    );
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [existingUsers] = await connection.query(
      "SELECT id FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (existingUsers.length > 0) {
      await connection.query(
        `UPDATE users
         SET password = ?, role = 'superadmin', phone = ?, hospital_id = NULL, branch_id = NULL
         WHERE id = ?`,
        [hashedPassword, phone, existingUsers[0].id]
      );

      console.log(`Updated existing user '${username}' to superadmin.`);
      return;
    }

    await connection.query(
      `INSERT INTO users (username, password, role, phone, hospital_id, branch_id)
       VALUES (?, ?, 'superadmin', ?, NULL, NULL)`,
      [username, hashedPassword, phone]
    );

    console.log(`Created superadmin '${username}'.`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Failed to create superadmin:", error.message);
  process.exit(1);
});
