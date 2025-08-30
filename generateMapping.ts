import fs from "fs";

interface Mapping {
  [province: string]: { [oldWard: string]: string };
}

function generateWardMapping() {

  const splits = JSON.parse(fs.readFileSync("splits.json", "utf-8"));
  const merges = JSON.parse(fs.readFileSync("merges.json", "utf-8"));

  const wardMapping: Mapping = {};


  for (const level1 of merges.data) {
    const province = level1.name;
    if (!wardMapping[province]) wardMapping[province] = {};
    for (const level2 of level1.level2s || []) {
      const newWard = level2.name;
      for (const merge of level2.merges) {
        const oldWard = merge.name;
        wardMapping[province][oldWard] = newWard; 
      }
    }
  }

 
  for (const level1 of splits.data) {
    const province = level1.name;
    if (!wardMapping[province]) wardMapping[province] = {};
    for (const level3 of level1.level3s || []) {
      const oldWard = level3.name;
      const newWard =
        level3.splits && level3.splits.length > 0
          ? level3.splits[0].name
          : oldWard;
      wardMapping[province][oldWard] = newWard;
    }
  }

  // Lưu mapping
  fs.writeFileSync(
    "ward_mapping.json",
    JSON.stringify(wardMapping, null, 2),
    "utf-8"
  );
  console.log("Ward mapping generated at ward_mapping.json");
}

generateWardMapping();
