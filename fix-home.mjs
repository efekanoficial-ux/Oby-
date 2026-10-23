import fs from "fs";

let content = fs.readFileSync("src/pages/home.tsx", "utf-8");

// We want to remove data-tour="step-3" from the bottom block.
// Let's replace 'data-tour="step-3"' with 'data-tour="step-3-old"' only where it appears AFTER the toolbar.
// Actually, let's just replace all data-tour="step-3" with data-tour="step-3-old", then add it back to the Calendar button.

content = content.replace(/data-tour="step-3"/g, 'data-tour="step-3-old"');
// The Calendar button looks like this:
// <button onClick={() => setShowDuration(true)} style={tbBtn(false)} data-tour="step-3-old" title="Vade Süresi">
content = content.replace(
  '<button onClick={() => setShowDuration(true)} style={tbBtn(false)} data-tour="step-3-old" title="Vade Süresi">',
  '<button onClick={() => setShowDuration(true)} style={tbBtn(false)} data-tour="step-3" title="Vade Süresi">'
);

fs.writeFileSync("src/pages/home.tsx", content);
