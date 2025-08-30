// import mongoose, {Schema, Model, model }from "mongoose";
export interface IUser {
  id?: number;
  name: string;
  phone: string;
  password: string;
  role: string;
  createAt?: Date;
  updateAt?: Date;
}
import pool from "../config/db";

/* const userSchema: Schema<IUser> = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true , unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
}, {timestamps: true});
const User: Model<IUser> = mongoose.model("User", userSchema);
export default User; */
export async function createUser(user: IUser) {
  const query = `INSERT INTO users (name,phone,password,role)
  VALUES ($1,$2,$3,$4) RETURNING *;
  `;
  const values = [user.name, user.phone, user.password, user.role || "user"];
  const result = await pool.query(query, values);
  return result.rows[0];
}
