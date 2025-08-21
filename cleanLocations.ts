import mongoose from "mongoose";
import Listing from "./models/Listing"; // chỉnh lại path tới model Listing của bạn
import dotenv from "dotenv";
dotenv.config();

async function cleanLocations() {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ MongoDB connected");

    const listings = await Listing.find({});
    console.log(`🔎 Tìm thấy ${listings.length} listings cần xử lý`);

    for (const listing of listings) {
      if (listing.location) {
        const cleaned = listing.location.replace(/^\.+/, "").trim();
        if (cleaned !== listing.location) {
          listing.location = cleaned;
          await listing.save();
          console.log(`🧹 Đã clean: ${cleaned}`);
        }
      }
    }

    console.log("🎉 Hoàn tất dọn dữ liệu location!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Lỗi:", err);
  }
}

cleanLocations();
