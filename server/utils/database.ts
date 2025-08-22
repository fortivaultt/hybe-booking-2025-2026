import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";

let db: initSqlJs.Database | null = null;

export const initializeDatabase = async () => {
  if (db) {
    return db;
  }

  try {
    const dbPath = process.env.SQLITE_DB_PATH || "server/db/cache.db";
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const wasmUrl = path.join("node_modules", "sql.js", "dist", "sql-wasm.wasm");
    const SQL = await initSqlJs({
        locateFile: () => wasmUrl,
    });

    let buffer: Buffer | null = null;
    if (fs.existsSync(dbPath)) {
      buffer = fs.readFileSync(dbPath);
    }

    db = new SQL.Database(buffer);

    db.run(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT,
        expires_at INTEGER
      )
    `);

    console.info("Database Initialized");
    return db;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    db = null;
    return null;
  }
};

export const getDatabase = () => {
  return db;
};

export const closeDatabase = () => {
  if (db) {
    db.close();
    db = null;
  }
};
