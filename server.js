const express = require('express');
const path = require('path');
require('dotenv').config();

const phoneRoutes = require('./routes/phoneRoutes');
const authRoutes = require('./routes/authRoutes');
const { loadUser } = require('./middleware/auth');
const authController = require('./controllers/authController');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(loadUser);
app.use('/', authRoutes);
app.use('/', phoneRoutes);

app.use((req, res) => {
  res.status(404).render('404', { title: 'Faqja nuk u gjet' });
});

authController.ensureDemoAdmin()
  .then(() => {
    app.listen(port, () => {
      console.log(`Serveri po punon ne http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Nuk u krijua llogaria demo e administratorit. Kontrollo databazën dhe tabelat e autentikimit.', error.message);
    process.exitCode = 1;
  });
