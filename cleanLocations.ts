import dotenv from "dotenv";
import pool from "./config/db";
dotenv.config();

async function cleanLocations() {
  try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL connected");

    const res = await client.query(
      "SELECT id, province, district, ward FROM listings"
    );
    console.log(`🔎 Tìm thấy ${res.rows.length} listings cần xử lý`);

    for (const row of res.rows) {
      // Clean từng field
      const cleanedProvince = row.province?.replace(/^\.+/, "").trim();
      const cleanedDistrict = row.district?.replace(/^\.+/, "").trim();
      const cleanedWard = row.ward?.replace(/^\.+/, "").trim();

      if (
        cleanedProvince !== row.province ||
        cleanedDistrict !== row.district ||
        cleanedWard !== row.ward
      ) {
        await client.query(
          `UPDATE listings
           SET province = $1, district = $2, ward = $3
           WHERE id = $4`,
          [cleanedProvince, cleanedDistrict, cleanedWard, row.id]
        );
        console.log(`🧹 Đã clean: ${row.id}`);
      }
    }

    console.log("🎉 Hoàn tất dọn dữ liệu location!");
    client.release();
    await pool.end();
  } catch (err) {
    console.error("❌ Lỗi:", err);
  }
}

cleanLocations();
