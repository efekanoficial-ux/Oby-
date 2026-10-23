import fs from "fs";
let content = fs.readFileSync("src/pages/wallet.tsx", "utf-8");

content = content.replace(
`      await addRequest({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName,
        type: "deposit",
        amount: numAmt,
        currency: method.currency,
        method: methodLabelWithCode,
        destination: dest,
        receiptUrl: receiptFile?.dataUrl,
        receiptName: receiptFile?.name,
      });`,
`      const reqPayload: any = {
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName,
        type: "deposit",
        amount: numAmt,
        currency: method.currency,
        method: methodLabelWithCode,
        destination: dest,
      };
      if (receiptFile?.dataUrl) reqPayload.receiptUrl = receiptFile.dataUrl;
      if (receiptFile?.name) reqPayload.receiptName = receiptFile.name;
      await addRequest(reqPayload);`
);

fs.writeFileSync("src/pages/wallet.tsx", content);
