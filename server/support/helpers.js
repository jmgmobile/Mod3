import { pool } from "../src/db.js";
import { createApp } from "../src/app.js";

export function buildApp() {
  return createApp();
}

export async function limpiarDb() {
  await pool.query("TRUNCATE prestadores CASCADE");
}

export async function cerrarDb() {
  await pool.end();
}
