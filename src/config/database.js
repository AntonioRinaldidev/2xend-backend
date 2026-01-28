require("dotenv").config();

// Se esiste DATABASE_URL (usata da Prisma), la usiamo come riferimento principale
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in environment variables.");
}

// Estraiamo i dati dalla stringa per compatibilità con eventuali altre parti del codice
// Esempio stringa: postgresql://user:pass@host:port/dbname
const matches = databaseUrl.match(
  /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/,
);

const DbConfig = {
  url: databaseUrl,
  user: matches ? matches[1] : null,
  password: matches ? matches[2] : null,
  host: matches ? matches[3] : null,
  port: matches ? matches[4] : null,
  database: matches ? matches[5] : null,
};

module.exports = DbConfig;
