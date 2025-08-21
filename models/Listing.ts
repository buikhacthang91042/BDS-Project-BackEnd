import mongoose, { Schema, Document, Model } from "mongoose";
export interface IListing extends Document {
  title: string;
  desciption?: string;
  price: number;
  area: number;
  province: string;
  district: string;
  ward?: string;
  uniqueKey: string;
  dateScraped: Date;
}

const ListingSchema: Schema<IListing> = new Schema({
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
export default Listing;
