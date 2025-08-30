import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import path from "path";
import pool from "../config/db";
puppeteer.use(StealthPlugin());

const COOKIES_PATH = path.join(__dirname, "../cookies.json");

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadCookies(page: any) {
  if (fs.existsSync(COOKIES_PATH)) {
    const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, "utf-8"));
    await page.setCookie(...cookies);
    console.log("Đã load cookies");
  }
}

async function saveCookies(page: any) {
  const cookies = await page.cookies();
  fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
  console.log("Đã lưu cookies");
}

function makeUniqueKey(url: string): string {
  const crypto = require("crypto");
  return crypto.createHash("md5").update(url).digest("hex");
}

function parseLocation(location: string) {
  let province = "";
  let district = "";
  let ward = "";

  const parts = location.split(",").map((p) => p.trim());
  if (parts.length > 0) province = parts[parts.length - 1];
  if (parts.length > 1) district = parts[parts.length - 2];
  if (parts.length > 2) ward = parts[parts.length - 3];

  return { province, district, ward };
}

async function getLatLong(
  address: string
): Promise<{ lat: number | null; long: number | null }> {
  try {
    if (!address || address.trim() === "") {
      console.log("❌ Địa chỉ trống, không thể lấy lat/long");
      return { lat: null, long: null };
    }

    let cleanedAddress = address.replace(/Dự án\s+/i, "").trim();
    console.log("Địa chỉ đã làm sạch:", cleanedAddress);

    const fetch = (await import("node-fetch")).default;
    const MAPBOX_ACCESS_TOKEN =
      "pk.eyJ1IjoidGhhbmcyNjA5MDMiLCJhIjoiY21lczAxZ3o0MGJ2MTJxb2J0MnJwdDIycyJ9.bcWNlRrXptwn9hVx5NMhlg";
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      cleanedAddress
    )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=vn&language=vi`;

    const res = await fetch(url);
    const data = (await res.json()) as any;

    if (data.features && data.features.length > 0) {
      const [long, lat] = data.features[0].center;
      return { lat, long };
    } else {
      console.log(
        "❌ Không tìm thấy lat/long cho địa chỉ:",
        cleanedAddress,
        "Status:",
        data.message || "No results"
      );
    }
  } catch (err) {
    console.error("❌ Geocode error:", err);
  }
  return { lat: null, long: null };
}

async function scrapeListings() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await loadCookies(page);

  const maxPages = parseInt(process.env.SCRAPER_MAX_PAGES || "5");
  const delayMs = parseInt(process.env.SCRAPER_DELAY || "2000");

  let totalSaved = 0;

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const url = `https://batdongsan.com.vn/nha-dat-ban/p${pageNum}`;
    console.log(`🌐 Đang cào trang ${pageNum}/${maxPages}: ${url}`);

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

      const listings = await page.$$eval(".js__card", (cards) =>
        cards.map((card) => {
          const title =
            card.querySelector(".js__card-title")?.textContent?.trim() || "";
          const priceText =
            card.querySelector(".re__card-config-price")?.textContent?.trim() ||
            "";
          const areaText =
            card.querySelector(".re__card-config-area")?.textContent?.trim() ||
            "";
          let location =
            card.querySelector(".re__card-location")?.textContent || "";
          location = location.replace(/\s+/g, " ").trim();

          const link = card.querySelector("a")?.getAttribute("href") || "";
          return { title, priceText, areaText, location, link };
        })
      );

      console.log(
        `📦 Thu thập được ${listings.length} tin từ trang ${pageNum}`
      );

      for (const item of listings) {
        try {
          // chuẩn bị dữ liệu cơ bản
          let price: number | null = null;
          if (item.priceText.includes("tỷ")) {
            price =
              parseFloat(
                item.priceText.replace(/[^\d,.-]/g, "").replace(",", ".")
              ) * 1e9;
          } else if (item.priceText.includes("triệu")) {
            price =
              parseFloat(
                item.priceText.replace(/[^\d,.-]/g, "").replace(",", ".")
              ) * 1e6;
          }

          let area: number | null = null;
          if (item.areaText.includes("m²")) {
            area = parseFloat(
              item.areaText.replace(/[^\d,.-]/g, "").replace(",", ".")
            );
          }

          const urlFull = item.link.startsWith("http")
            ? item.link
            : `https://batdongsan.com.vn${item.link}`;

          const uniqueKey = makeUniqueKey(urlFull);
          const { province, district, ward } = parseLocation(item.location);

          // ✅ kiểm tra DB trước
          const check = await pool.query(
            "SELECT lat, long FROM listings WHERE unique_key = $1",
            [uniqueKey]
          );

          let lat: number | null = null;
          let long: number | null = null;

          if (
            check.rows.length > 0 &&
            check.rows[0].lat &&
            check.rows[0].long
          ) {
            // ✅ nếu đã có lat/long thì không gọi Mapbox nữa
            lat = check.rows[0].lat;
            long = check.rows[0].long;
            console.log(
              `⚡ Bỏ qua Mapbox vì đã có lat/long trong DB cho ${item.title}`
            );
          } else {
            // 🔄 nếu chưa có thì mới gọi mapbox
            await page.goto(urlFull, {
              waitUntil: "domcontentloaded",
              timeout: 60000,
            });

            const detail = await page.evaluate(() => {
              const addressElement =
                document.querySelector(
                  ".re__pr-short-description.js__pr-address"
                ) ||
                document.querySelector(".pr-address") ||
                document.querySelector(".js__pr-address");
              const address = addressElement?.textContent?.trim() || "";
              return { address };
            });

            console.log("Địa chỉ gửi đến getLatLong:", detail.address);
            await delay(2000);
            const coords = await getLatLong(detail.address);
            lat = coords.lat;
            long = coords.long;
          }

          // --- lưu vào DB nếu có lat/long ---
          if (lat !== null && long !== null) {
            await pool.query(
              `INSERT INTO listings (unique_key, title, price, area, province, district, ward, lat, long, geom, date_scraped)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, ST_SetSRID(ST_MakePoint($9, $8), 4326), $10)
   ON CONFLICT (unique_key)
   DO UPDATE SET 
     title = EXCLUDED.title,
     price = EXCLUDED.price,
     area = EXCLUDED.area,
     province = EXCLUDED.province,
     district = EXCLUDED.district,
     ward = EXCLUDED.ward,
     lat = EXCLUDED.lat,
     long = EXCLUDED.long,
     geom = ST_SetSRID(ST_MakePoint(EXCLUDED.long, EXCLUDED.lat), 4326), 
     date_scraped = EXCLUDED.date_scraped`,
              [
                uniqueKey,
                item.title,
                price,
                area,
                province,
                district,
                ward,
                lat,
                long,
                new Date(),
              ]
            );

            totalSaved++;
          } else {
            console.log("❌ Bỏ qua tin rao vì lat/long null:", item.title);
          }
        } catch (err: any) {
          console.error("❌ Lỗi khi xử lý tin rao:", err.message);
        }
      }
    } catch (err: any) {
      console.error(`⚠️ Lỗi khi cào trang ${pageNum}:`, err.message);
    }

    if (pageNum < maxPages) {
      console.log(`⏳ Chờ ${delayMs / 1000}s...`);
      await delay(delayMs);
    }
  }

  console.log(`🎉 Tổng số tin đã lưu hoặc cập nhật: ${totalSaved}`);
  await saveCookies(page);
  await browser.close();
}

export default scrapeListings;
