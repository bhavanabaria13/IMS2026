import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// SINGLE pool declaration (DO NOT DUPLICATE)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Drizzle instance
export const db = drizzle(pool, { schema });
