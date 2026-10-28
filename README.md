# Phone Store

Phone Store është një dyqan online demonstrues për telefona. Vizitorët mund të shfletojnë dhe kërkojnë produkte pa llogari. Klientët mund t’i shtojnë produktet në shportë dhe kyçen për të dërguar porosinë. Administratori menaxhon katalogun dhe sheh porositë nga paneli i adminit.

**Përshkrim i shkurtër për GitHub:** Dyqan online për telefona me katalog, shportë, porosi dhe panel administrimi, i ndërtuar me Node.js, Express, MySQL dhe EJS.

## Çfarë mund të bëjë aplikacioni

- Shfaq katalogun e telefonave me çmim, kapacitet, ngjyrë dhe fotografi.
- Kërkon telefona sipas emrit, kapacitetit ose ngjyrës.
- Shfaq faqen me hollësi për secilin produkt.
- Ruajnë shportën në shfletues, edhe para kyçjes.
- Kërkon kyçje ose regjistrim kur klienti dëshiron të vazhdojë me porosinë.
- Regjistron porosinë dhe produktet e saj në MySQL. Çmimi merret nga databaza në server.
- Ofron hyrje me role të ndara për klient dhe administrator.
- Lejon administratorin të shtojë, përditësojë dhe fshijë telefona.
- Ofron panel administrimi te `/admin/orders`, ku shfaqen porositë, të dhënat e klientit, artikujt dhe përmbledhja e shitjeve.

## Teknologjitë

- Node.js dhe Express
- MySQL me `mysql2`
- EJS për faqet dinamike
- HTML, CSS dhe JavaScript për ndërfaqen dhe shportën

## Si funksionon

Serveri Express merr kërkesat dhe i dërgon te routes. Controllers përpunojnë hyrjen, produktet dhe porositë; modelet komunikojnë me MySQL; EJS i kthen të dhënat në faqe HTML. Shporta ruhet në shfletues. Gjatë checkout-it serveri i kontrollon produktet dhe çmimet në databazë, pastaj ruan porosinë dhe artikujt e saj në një transaksion MySQL.

## Nisja në kompjuter

1. Nise MySQL në XAMPP.
2. Importo `database.sql` në phpMyAdmin. Importoje vetëm një herë, sepse përmban edhe produkte fillestare.
3. Kopjo `.env.example` në `.env` dhe vendos të dhënat e lidhjes me databazën. Mund të vendosësh edhe `ADMIN_EMAIL` dhe `ADMIN_PASSWORD` për llogarinë e administratorit.
4. Instalo paketat dhe nise aplikacionin:

   ```bash
   npm install
   npm start
   ```

5. Hape `http://localhost:3000` në shfletues.

Vlerat e databazës në zhvillim mund të ndryshohen në `.env`. Mos e ngarko `.env` në GitHub.

## Publikimi online

Aplikacioni përdor `PORT` nga hosti dhe mund të niset me `npm start`. Për publikim online nevojitet një host që ekzekuton Node.js dhe një databazë MySQL. Në mjedisin production vendos `NODE_ENV=production`, `ADMIN_EMAIL` dhe një `ADMIN_PASSWORD` unik me së paku 16 karaktere, si dhe variablat `DB_HOST`, `DB_USER`, `DB_PASSWORD` dhe `DB_NAME`.

## Struktura kryesore

```text
config/       Lidhja me MySQL
controllers/ Logjika e autentikimit dhe dyqanit
models/      Pyetjet dhe ndryshimet në databazë
routes/      Rrugët e aplikacionit
views/       Faqet EJS
public/      CSS dhe JavaScript për shfletuesin
database.sql Skema dhe produktet fillestare
```
