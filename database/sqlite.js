import sqlite3 from "sqlite3";
import { open } from "sqlite";

export default async function connDB() {
    try {
        const db = await open({
            filename: './database/database.db',
            driver: sqlite3.Database
        })

        return db;
    } catch (error) {
        throw error
    }
}