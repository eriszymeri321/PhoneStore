const pool = require("../config/db");

async function run() {
  try {
    console.log("Creating `phones` table if not exists...");

    const createSql = `
      CREATE TABLE IF NOT EXISTS phones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        capacity VARCHAR(50) NOT NULL,
        color VARCHAR(100) NOT NULL,
        image_url VARCHAR(500) DEFAULT ''
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    await pool.query(createSql);
    console.log("Table created or already existed.");

    // Insert sample rows if table is empty
    const [countRows] = await pool.query("SELECT COUNT(*) AS cnt FROM phones");
    const cnt = countRows[0].cnt;
    if (cnt === 0) {
      console.log("Seeding initial phone rows...");
      const insertSql = `
        INSERT INTO phones (name, price, capacity, color, image_url) VALUES
        ('Apple iPhone 15', 1050.00, '128GB', 'Black', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=80'),
        ('Samsung Galaxy S24', 899.99, '256GB', 'Gray', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=900&q=80'),
        ('Google Pixel 8', 699.00, '128GB', 'Obsidian', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80');
      `;
      await pool.query(insertSql);
      console.log("Seeding complete.");
    } else {
      console.log("Table already has data; skipping seed.");
    }

    await pool.end();
    console.log("Done.");
  } catch (err) {
    console.error("Error creating/seeding phones table:", err.message);
    process.exitCode = 1;
  }
}

run();
