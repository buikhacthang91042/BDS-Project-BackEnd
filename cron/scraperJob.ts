import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import path from "path";
import Listing from "../models/Listing";

puppeteer.use(StealthPlugin());

const COOKIES_PATH = path.join(__dirname, "../cookies.json");

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadCookies(page: any) {
  if (fs.existsSync(COOKIES_PATH)) {
    const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, "utf-8"));
    await page.setCookie(...cookies);
    console.log(" Đã load cookies");
  }
}

async function saveCookies(page: any) {
  const cookies = await page.cookies();
  fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
  console.log(" Đã lưu cookies");
}

function makeUniqueKey(url: string): string {
  const crypto = require("crypto");
  return crypto.createHash("md5").update(url).digest("hex");
}

// Hàm parse location → tách tỉnh, huyện, xã
function parseLocation(location: string) {
  let province = "";
  let district = "";
  let ward = "";

  const parts = location.split(",").map((p) => p.trim());

  if (parts.length > 0) {
    province = parts[parts.length - 1];
  }
  if (parts.length > 1) {
    district = parts[parts.length - 2];
  }
  if (parts.length > 2) {
    ward = parts[parts.length - 3];
  }

  return { province, district, ward };
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

          await Listing.updateOne(
            { uniqueKey },
            {
              $set: {
                uniqueKey,
                title: item.title,
                price,
                area,
                province,
                district,
                ward,
                desciption: "",
                dateScraped: new Date(),
              },
            },
            { upsert: true }
          );

          totalSaved++;
        } catch (err: any) {
          console.error("❌ Lỗi khi lưu:", err.message);
        }
      }
    } catch (err: any) {
      console.error(`⚠️ Lỗi khi cào trang ${pageNum}:`, err.message);
    }

    if (pageNum < maxPages) {
      console.log(
        `⏳ Chờ ${delayMs / 1000}s trước khi sang trang tiếp theo...`
      );
      await delay(delayMs);
    }
  }

  console.log(`🎉 Tổng số tin đã lưu hoặc cập nhật: ${totalSaved}`);

  await saveCookies(page);
  await browser.close();
}

export default scrapeListings;
