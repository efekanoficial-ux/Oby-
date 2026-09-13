import fs from "fs";
let content = fs.readFileSync("src/pages/admin.tsx", "utf-8");

content = content.replace(
  'className="p-4 max-w-2xl mx-auto flex flex-col gap-6"',
  'className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6"'
);

content = content.replace(
  'className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-6"',
  'className="p-4 sm:p-8 max-w-5xl mx-auto flex flex-col gap-6"'
);

fs.writeFileSync("src/pages/admin.tsx", content);
