import fs from "fs";

let content = fs.readFileSync("src/pages/home.tsx", "utf-8");

// Remove from toolbar
content = content.replace(
  '<button onClick={() => setShowDuration(true)} style={tbBtn(false)} data-tour="step-3" title="Vade Süresi">',
  '<button onClick={() => setShowDuration(true)} style={tbBtn(false)} title="Vade Süresi">'
);

// Add to Zaman button
const searchStr = `{/* Zaman */}
        <button
          onClick={() => setShowDuration(true)}
          style={{ flex: 1, background: "#1c1c1c", borderRadius: 12, padding: "7px 10px", border: "1px solid #252525", textAlign: "left", cursor: "pointer" }}`;

const replaceStr = `{/* Zaman */}
        <button
          onClick={() => setShowDuration(true)}
          data-tour="step-3"
          style={{ flex: 1, background: "#1c1c1c", borderRadius: 12, padding: "7px 10px", border: "1px solid #252525", textAlign: "left", cursor: "pointer" }}`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync("src/pages/home.tsx", content);
