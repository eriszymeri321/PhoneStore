const phoneModel = require("../models/phoneModel");
const db = require("../config/db");

function normalizePhone(body) {
  return {
    name: String(body.name || "").trim(),
    price: String(body.price || "").trim(),
    capacity: String(body.capacity || "").trim(),
    color: String(body.color || "").trim(),
    image_url: String(body.image_url || "").trim(),
  };
}

function validatePhone(phone) {
  const errors = {};
  const price = Number(phone.price);

  if (!phone.name) errors.name = "Emri i telefonit eshte i detyrueshem.";
  if (!phone.price || Number.isNaN(price) || price < 0)
    errors.price = "Cmimi duhet te jete numer pozitiv.";
  if (!phone.capacity) errors.capacity = "Kapaciteti eshte i detyrueshem.";
  if (!phone.color) errors.color = "Ngjyra eshte e detyrueshme.";

  if (phone.image_url) {
    try {
      new URL(phone.image_url);
    } catch {
      errors.image_url = "URL e fotos nuk eshte valide.";
    }
  }

  return errors;
}

async function index(req, res, next) {
  try {
    const search = String(req.query.search || "").trim();
    const success = String(req.query.success || "").trim();
    const phones = await phoneModel.getAll(search);
    res.render("phones/index", {
      title: "Lista e telefoneve",
      phones,
      search,
      success,
    });
  } catch (error) {
    next(error);
  }
}

function cart(req, res) {
  res.render("phones/cart", { title: "Shporta" });
}

async function adminOrders(req, res, next) {
  try {
    const [orders, stats] = await Promise.all([
      phoneModel.getOrders(),
      phoneModel.getOrderStats(),
    ]);
    res.render("admin/orders", { title: "Porositë", orders, stats });
  } catch (error) {
    next(error);
  }
}

async function checkout(req, res, next) {
  const items = req.body.items;
  const customer = {
    name: String(req.body.customerName || "").trim(),
    email: String(req.body.customerEmail || "").trim(),
    phone: String(req.body.customerPhone || "").trim(),
    address: String(req.body.customerAddress || "").trim(),
  };
  if (!customer.name || !customer.email || !customer.phone || !customer.address) {
    return res.status(400).json({ error: "Plotëso të gjitha të dhënat e klientit." });
  }
  if (customer.name.length > 150 || customer.email.length > 190 || customer.phone.length > 40 || customer.address.length > 500 || !/^\S+@\S+\.\S+$/.test(customer.email)) {
    return res.status(400).json({ error: "Të dhënat e klientit nuk janë valide." });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Shporta është bosh." });
  }

  const normalized = items.map((item) => ({
    id: Number(item.id),
    quantity: Number(item.quantity),
  }));
  if (normalized.some((item) => !Number.isInteger(item.id) || item.id < 1 || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) {
    return res.status(400).json({ error: "Të dhënat e produkteve nuk janë valide." });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [phones] = await connection.query(
      `SELECT id, price FROM phones WHERE id IN (${normalized.map(() => "?").join(",")}) FOR UPDATE`,
      normalized.map((item) => item.id),
    );
    const byId = new Map(phones.map((phone) => [phone.id, phone]));
    if (normalized.some((item) => !byId.has(item.id))) {
      await connection.rollback();
      return res.status(400).json({ error: "Një telefon në shportë nuk gjendet më." });
    }
    const total = normalized.reduce((sum, item) => sum + Number(byId.get(item.id).price) * item.quantity, 0);
    const [result] = await connection.execute(
      "INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, customer_address, total) VALUES (?, ?, ?, ?, ?, ?)",
      [req.user.id, customer.name, customer.email, customer.phone, customer.address, total.toFixed(2)],
    );
    for (const item of normalized) {
      await connection.execute(
        "INSERT INTO order_items (order_id, phone_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
        [result.insertId, item.id, item.quantity, byId.get(item.id).price],
      );
    }
    await connection.commit();
    return res.json({ orderId: result.insertId });
  } catch (error) {
    if (connection) await connection.rollback();
    return next(error);
  } finally {
    if (connection) connection.release();
  }
}

function showCreate(req, res) {
  res.render("phones/form", {
    title: "Shto telefon",
    action: "/phones",
    buttonText: "Ruaj telefonin",
    phone: {},
    errors: {},
  });
}

async function store(req, res, next) {
  try {
    const phone = normalizePhone(req.body);
    const errors = validatePhone(phone);

    if (Object.keys(errors).length > 0) {
      return res.status(422).render("phones/form", {
        title: "Shto telefon",
        action: "/phones",
        buttonText: "Ruaj telefonin",
        phone,
        errors,
      });
    }

    await phoneModel.create(phone);
    return res.redirect("/?success=created");
  } catch (error) {
    return next(error);
  }
}

async function show(req, res, next) {
  try {
    const phone = await phoneModel.getById(req.params.id);
    if (!phone) return res.redirect("/");

    return res.render("phones/show", {
      title: phone.name,
      phone,
    });
  } catch (error) {
    return next(error);
  }
}

async function showEdit(req, res, next) {
  try {
    const phone = await phoneModel.getById(req.params.id);
    if (!phone) return res.redirect("/");

    return res.render("phones/form", {
      title: "Ndrysho telefon",
      action: `/phones/${phone.id}/edit`,
      buttonText: "Ruaj ndryshimet",
      phone,
      errors: {},
    });
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const phone = normalizePhone(req.body);
    const errors = validatePhone(phone);

    if (Object.keys(errors).length > 0) {
      return res.status(422).render("phones/form", {
        title: "Ndrysho telefon",
        action: `/phones/${req.params.id}/edit`,
        buttonText: "Ruaj ndryshimet",
        phone: { id: req.params.id, ...phone },
        errors,
      });
    }

    await phoneModel.update(req.params.id, phone);
    return res.redirect("/?success=updated");
  } catch (error) {
    return next(error);
  }
}

async function showDelete(req, res, next) {
  try {
    const phone = await phoneModel.getById(req.params.id);
    if (!phone) return res.redirect("/");

    return res.render("phones/delete", { title: "Fshij telefon", phone });
  } catch (error) {
    return next(error);
  }
}

async function destroy(req, res, next) {
  try {
    await phoneModel.remove(req.params.id);
    return res.redirect("/?success=deleted");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  index,
  cart,
  checkout,
  adminOrders,
  showCreate,
  store,
  show,
  showEdit,
  update,
  showDelete,
  destroy,
};
