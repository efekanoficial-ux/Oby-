import fs from "fs";
let content = fs.readFileSync("src/pages/admin.tsx", "utf-8");

const oldTabs = `{([
          { id: "requests", label: "İstekler",     badge: pendingCount },
          { id: "users",    label: "Kullanıcılar"                      },
          { id: "settings", label: "Hesap & Cüzdan Ayarları"            },
          { id: "telegram", label: "Telegram Botu", isTelegram: true   },
        ] as { id: AdminTab; label: string; badge?: number; isTelegram?: boolean }[]).map(t => {
          const isActive = tab === t.id;
          const isTgConfigured = Boolean(formSettings.telegramBotToken?.trim() && formSettings.telegramChatId?.trim());
          const activeColor = t.isTelegram ? "#2AABEE" : "#FF6B00";
          return (
            <button key={t.id} onClick={() => setTab(t.id as AdminTab)}
              className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-[120px] justify-center py-3 text-xs sm:text-sm font-black relative cursor-pointer select-none px-2 whitespace-nowrap"
              style={{ color: isActive ? activeColor : "#555" }}>`;

const newTabs = `{([
          { id: "requests", label: "İstekler",     badge: pendingCount },
          { id: "users",    label: "Kullanıcılar"                      },
          { id: "settings", label: "Cüzdanlar"                         },
          { id: "telegram", label: "Telegram",     isTelegram: true    },
        ] as { id: AdminTab; label: string; badge?: number; isTelegram?: boolean }[]).map(t => {
          const isActive = tab === t.id;
          const isTgConfigured = Boolean(formSettings.telegramBotToken?.trim() && formSettings.telegramChatId?.trim());
          const activeColor = t.isTelegram ? "#2AABEE" : "#FF6B00";
          return (
            <button key={t.id} onClick={() => setTab(t.id as AdminTab)}
              className="flex items-center gap-1.5 justify-center py-3 px-4 text-xs font-black relative cursor-pointer select-none whitespace-nowrap flex-1 md:flex-none"
              style={{ color: isActive ? activeColor : "#555" }}>`;

content = content.replace(oldTabs, newTabs);

fs.writeFileSync("src/pages/admin.tsx", content);
