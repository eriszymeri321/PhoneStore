# Phone Store

Phone Store is a demonstration e-commerce web application for mobile phones. Visitors can browse and search products without requiring an account. Customers can add items to their shopping cart and log in or register to place an order. Administrators can manage the catalog and view orders through an admin dashboard.

**Short GitHub Description:** E-commerce web application for mobile phones featuring a catalog, shopping cart, order management, and admin dashboard, built with Node.js, Express, MySQL, and EJS.

## Key Features

- Displays a phone catalog with pricing, storage capacity, color, and images.
- Search functionality by phone name, storage capacity, or color.
- Dedicated product detail pages.
- Client-side shopping cart persistence in the browser, working even before login.
- Prompts authentication or registration during the checkout process.
- Saves orders and order items securely in MySQL, with prices validated server-side from the database.
- Role-based access control separating customer and administrator privileges.
- Admin management capabilities to add, update, and delete phone products.
- Dedicated admin panel at `/admin/orders` displaying customer details, purchased items, and sales summaries.

## Technologies Used

- **Backend:** Node.js, Express
- **Database:** MySQL with `mysql2`
- **Templating Engine:** EJS for dynamic views
- **Frontend:** HTML, CSS, and JavaScript for user interface and cart logic

## How It Works

The Express server handles incoming requests and routes them appropriately. Controllers process authentication, products, and order logic, models handle database operations with MySQL, and EJS renders data into HTML pages. The shopping cart is managed via browser storage. During checkout, the server validates products and prices against the database, securely saving the order and its items using a MySQL transaction.

## Getting Started Locally

1. Start MySQL (e.g., via XAMPP).
2. Import `database.sql` into phpMyAdmin. Import it only once, as it includes initial seed products.
3. Copy `.env.example` to `.env` and configure your database connection credentials. You can also define `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the administrator account.
4. Install dependencies and start the application:

   ```bash
   npm install
   npm start
