import { Response, Request } from "express";
import pool from "../config/db";

export const getHotSpot = async (req: Request, res: Response) => {
  try {
    const { province } = req.query;
    let query = `
      SELECT ${province ? "district" : "province"} AS location,
             COUNT(*) AS count,
             AVG(price) AS avg_price
      FROM listings
      ${province ? "WHERE province = $1" : ""}
      GROUP BY ${province ? "district" : "province"}
      ORDER BY count DESC
      LIMIT 10;
    `;

    const result = await pool.query(query, province ? [province] : []);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error("getHotSpot error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPriceTrends = async (req: Request, res: Response) => {
  try {
    const { province } = req.query;
    let query = `
      SELECT 
        EXTRACT(YEAR FROM date_scraped) AS year,
        EXTRACT(MONTH FROM date_scraped) AS month,
        ${province ? "district" : "province"} AS location,
        AVG(price) AS avg_price
      FROM listings
      ${province ? "WHERE province = $1" : ""}
      GROUP BY year, month, location
      ORDER BY year ASC, month ASC;
    `;

    const result = await pool.query(query, province ? [province] : []);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error("getPriceTrends error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { getHotSpot, getPriceTrends };
