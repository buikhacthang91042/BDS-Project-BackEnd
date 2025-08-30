// import mongoose, { Schema, Document, Model } from "mongoose";
export interface IListing extends Document {
  id?: number;
  unique_key: string;
  title: string;
  price: number | null;
  area: number | null;
  province: string;
  district: string;
  ward: string;
  lat: number | null;
  long: number | null;
  date_scraped?: Date;
}

/* const ListingSchema: Schema<IListing> = new Schema({
  title: { type: String, required: true },
  price: { type: Number, required: false, default: null },
  area: { type: Number, required: true },
  desciption: { type: String, required: false, default: "" },
  province: { type: String, required: true },
  district: { type: String, required: true },
  ward: { type: String, required: false, default: "" },
  uniqueKey: { type: String, required: true, unique: true },
  dateScraped: { type: Date, default: Date.now },
});
const Listing: Model<IListing> = mongoose.model("Listing", ListingSchema);
export default Listing; */
import pool from "../config/db";

export async function createListing(listing: IListing) {
  const query = `
    INSERT INTO listings (
      title,
      price,
      area,
      province,
      district,
      ward,
      lat,
      long,
      unique_key,
      date_scraped
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    RETURNING *;
  `;

  const values = [
    listing.title,
    listing.price,
    listing.area,
    listing.province,
    listing.district,
    listing.ward,
    listing.lat,
    listing.long,
    listing.unique_key,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}
