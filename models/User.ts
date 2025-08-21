
import mongoose, {Schema, Model, model }from "mongoose";
interface IUser {
  name: string;
  phone: string;
  password: string;
  role: string;
  createAt?: Date;
  updateAt?: Date;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true , unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
}, {timestamps: true});
const User: Model<IUser> = mongoose.model("User", userSchema);
export default User;