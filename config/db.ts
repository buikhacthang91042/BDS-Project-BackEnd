// db.ts
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI,
});

pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL Cloud"))
  .catch((err) => console.error("❌ Connection error", err.stack));
console.log("🔑 POSTGRES_URI:", process.env.POSTGRES_URI);

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS listings (
        id SERIAL PRIMARY KEY,
        unique_key VARCHAR(64) UNIQUE NOT NULL,
        title TEXT,
        price BIGINT,
        area FLOAT,
        province VARCHAR(255),
        district VARCHAR(255),
        ward VARCHAR(255),
        lat DOUBLE PRECISION,
        long DOUBLE PRECISION,
        geom GEOMETRY(POINT, 4326),
        date_scraped TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        phone VARCHAR(20) UNIQUE,
        email VARCHAR(255),
        password TEXT, 
        provider VARCHAR(50),
        provider_id VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Tables initialized!");
  } catch (err) {
    console.error("❌ Error creating tables:", err);
  }
};

initDB();

export default pool;
