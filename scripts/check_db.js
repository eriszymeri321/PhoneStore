const pool = require("../config/db");

async function check() {
  try {
    console.log("Connecting to DB with config from config/db.js...");

    const [dbs] = await pool.query("SHOW DATABASES LIKE 'phone_store_db'");
    console.log(
      "Database check:",
      dbs.length ? "phone_store_db found" : "phone_store_db NOT found",
    );

    const [tables] = await pool.query("SHOW TABLES FROM phone_store_db");
    console.log("Tables in phone_store_db:");
    console.log(tables);

    try {
      const [rows] = await pool.query(
        "SELECT COUNT(*) AS cnt FROM phone_store_db.phones",
      );
      console.log("phones table row count:", rows[0].cnt);
    } catch (err) {
      console.error(
        "Error querying phones table (may not exist):",
        err.message,
      );
    }

    await pool.end();
  } catch (err) {
    console.error("Connection / query error:", err.message);
    process.exitCode = 1;
  }
}

check();
