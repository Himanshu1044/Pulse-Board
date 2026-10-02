import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import pool from "../config/database";

async function main() {
    const sql = readFileSync(path.join(__dirname, "../database/schema.sql"), "utf8");
    await pool.query(sql);
    console.log("Database schema is up to date.");
}

main()
    .catch((error) => {
        console.error("Failed to initialise the database:", error);
        process.exitCode = 1;
    })
    .finally(() => pool.end());