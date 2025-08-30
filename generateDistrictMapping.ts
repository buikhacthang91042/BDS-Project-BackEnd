import fs from "fs";

interface Mapping {
  [province: string]: { [oldDistrict: string]: string };
}

interface Level2 {
  name: string;
  merges?: { name: string }[];
}

interface Level3 {
  name: string;
  splits?: { name: string }[];
}

interface Level1 {
  name: string;
  level2s?: Level2[];
  level3s?: Level3[];
}

interface JsonData {
  data: Level1[];
}

function normalizeProvinceName(name: string): string {
  return name.replace("Thành phố ", "").replace("Tỉnh ", "").trim();
}

function generateDistrictMapping() {
  let merges: JsonData = { data: [] };
  let splits: JsonData = { data: [] };

  try {
    if (fs.existsSync("merges.json")) {
      merges = JSON.parse(fs.readFileSync("merges.json", "utf-8"));
    } else {
      console.warn(" merges.json không tồn tại, chỉ dùng manual mapping");
    }
    if (fs.existsSync("splits.json")) {
      splits = JSON.parse(fs.readFileSync("splits.json", "utf-8"));
    } else {
      console.warn("splits.json không tồn tại, chỉ dùng manual mapping");
    }
  } catch (err) {
    console.error("⚠️ Lỗi khi đọc JSON:", err);
  }

  const districtMapping: Mapping = {};

  // Xử lý merges
  for (const level1 of merges.data || []) {
    const province = normalizeProvinceName(level1.name || "");
    if (!districtMapping[province]) districtMapping[province] = {};
    for (const level2 of level1.level2s || []) {
      const newDistrict = level2.name || "";
      for (const merge of level2.merges || []) {
        districtMapping[province][merge.name || ""] = newDistrict;
      }
    }
  }

  // Xử lý splits
  for (const level1 of splits.data || []) {
    const province = normalizeProvinceName(level1.name || "");
    if (!districtMapping[province]) districtMapping[province] = {};
    for (const level3 of level1.level3s || []) {
      const oldDistrict = level3.name || "";
      const newDistrict =
        level3.splits && level3.splits.length > 0
          ? level3.splits[0].name
          : oldDistrict;
      districtMapping[province][oldDistrict] = newDistrict;
    }
  }

  // Manual mapping từ log và cải cách 2025
  districtMapping["Hồ Chí Minh"] = {
    "Quận 9": "Thành phố Thủ Đức",
    "Quận 2": "Thành phố Thủ Đức",
    "Thủ Đức": "Thành phố Thủ Đức",
    "Quận 1": "",
    "Quận 7": "",
    // Thêm các quận khác nếu cần
  };
  districtMapping["Bình Dương"] = {
    "Dĩ An": "",
    "Thuận An": "",
    "Thủ Dầu Một": "",
  };
  districtMapping["Hà Nội"] = {
    "Nam Từ Liêm": "",
    "Bắc Từ Liêm": "",
    "Đan Phượng": "",
    "Ba Đình": "",
  };
  districtMapping["Đồng Nai"] = {
    "Nhơn Trạch": "",
  };
  districtMapping["Hải Phòng"] = {
    "Thủy Nguyên": "",
    "Dương Kinh": "",
  };
  districtMapping["Đà Nẵng"] = {
    "Hải Châu": "",
  };
  districtMapping["Long An"] = {
    "Bến Lức": "",
  };
  districtMapping["Hưng Yên"] = {
    "Văn Giang": "",
  };
  districtMapping["Vĩnh Phúc"] = {
    "Phúc Yên": "",
  };

  fs.writeFileSync(
    "district_mapping.json",
    JSON.stringify(districtMapping, null, 2),
    "utf-8"
  );
  console.log("District mapping generated at district_mapping.json");
}

generateDistrictMapping();
