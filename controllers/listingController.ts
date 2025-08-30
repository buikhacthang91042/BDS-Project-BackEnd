import { Request, Response } from "express";
import pool from "../config/db";
import { features } from "process";

export const getListing = async (req: Request, res: Response) => {
  const { province } = req.body;

  try {
    let query = `SELECT title, ST_AsGeoJSON(geom)::json AS geometry, json_build_object(
        'title',title,
        'price', price,
          'area', area,
          'province', province,
          'district', district,
          'ward', ward
      ) AS properties FROM listings WHERE geom IS NOT NULL`;
    if (province) {
      query += ` AND province ILIKE $1`;
    }
    const result = province
      ? await pool.query(query, [province])
      : await pool.query(query);
    const geojson = {
      type: "FeatureCollection",
      features: (await result).rows.map((row) => ({
        type: "Feature",
        geometry: row.geometry,
        properties: row.properties,
      })),
    };
    res.json(geojson);
  } catch (err) {
    console.error("Error fetching listings:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
