const db = require('../config/db');

async function getAll(search = '') {
  if (search.trim() !== '') {
    const like = `%${search.trim()}%`;
    const [rows] = await db.execute(
      `SELECT id, name, price, capacity, color, image_url
       FROM phones
       WHERE name LIKE ? OR capacity LIKE ? OR color LIKE ?
       ORDER BY id DESC`,
      [like, like, like],
    );
    return rows;
  }

  const [rows] = await db.execute(
    `SELECT id, name, price, capacity, color, image_url
     FROM phones
     ORDER BY id DESC`,
  );
  return rows;
}

async function getById(id) {
  const [rows] = await db.execute(
    `SELECT id, name, price, capacity, color, image_url
     FROM phones
     WHERE id = ?`,
    [id],
  );
  return rows[0] || null;
}

async function create(phone) {
  const [result] = await db.execute(
    `INSERT INTO phones (name, price, capacity, color, image_url)
     VALUES (?, ?, ?, ?, ?)`,
    [phone.name, phone.price, phone.capacity, phone.color, phone.image_url],
  );
  return result.insertId;
}

async function update(id, phone) {
  await db.execute(
    `UPDATE phones
     SET name = ?, price = ?, capacity = ?, color = ?, image_url = ?
     WHERE id = ?`,
    [phone.name, phone.price, phone.capacity, phone.color, phone.image_url, id],
  );
}

async function remove(id) {
  await db.execute('DELETE FROM phones WHERE id = ?', [id]);
}

async function getOrders() {
  const [rows] = await db.execute(
    `SELECT o.id, o.customer_name, o.customer_email, o.customer_phone,
            o.customer_address, o.total, o.created_at,
            oi.quantity, oi.unit_price, p.name AS phone_name, p.capacity, p.color
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN phones p ON p.id = oi.phone_id
     ORDER BY o.created_at DESC, o.id DESC, oi.id ASC`,
  );
  const orders = new Map();
  for (const row of rows) {
    if (!orders.has(row.id)) {
      orders.set(row.id, {
        id: row.id,
        customer_name: row.customer_name,
        customer_email: row.customer_email,
        customer_phone: row.customer_phone,
        customer_address: row.customer_address,
        total: row.total,
        created_at: row.created_at,
        items: [],
      });
    }
    if (row.phone_name) {
      orders.get(row.id).items.push({
        name: row.phone_name,
        capacity: row.capacity,
        color: row.color,
        quantity: row.quantity,
        unit_price: row.unit_price,
      });
    }
  }
  return [...orders.values()];
}

async function getOrderStats() {
  const [[stats]] = await db.execute(
    `SELECT COUNT(*) AS total_orders,
            COALESCE(SUM(total), 0) AS total_revenue,
            COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END), 0) AS today_orders,
            COALESCE(AVG(total), 0) AS average_order
     FROM orders`,
  );
  return stats;
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getOrders,
  getOrderStats,
};
