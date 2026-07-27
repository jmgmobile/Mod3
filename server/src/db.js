import pg from "pg";

const { Pool, types } = pg;

// DATE (oid 1082): devolver el string "YYYY-MM-DD" tal cual, sin que pg lo
// convierta a un objeto Date (que aplica desplazamiento de zona horaria).
types.setTypeParser(1082, (val) => val);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export function query(text, params) {
  return pool.query(text, params);
}
