export interface Asset {
  label: string;
  base: number;
  payout: number;
  digits: number;
  desc: string;
}

export const ASSETS: Asset[] = [
  { label: "EUR/USD (OTC)", base: 1.0850, payout: 90, digits: 5, desc: "Euro / ABD Doları" },
  { label: "GBP/USD (OTC)", base: 1.2650, payout: 90, digits: 5, desc: "İngiliz Sterlini / ABD Doları" },
  { label: "USD/JPY (OTC)", base: 150.20, payout: 90, digits: 3, desc: "ABD Doları / Japon Yeni" },
  { label: "USD/CAD (OTC)", base: 1.3550, payout: 85, digits: 5, desc: "ABD Doları / Kanada Doları" },
  { label: "AUD/USD (OTC)", base: 0.6600, payout: 87, digits: 5, desc: "Avustralya Doları / ABD Doları" },
  { label: "USD/CHF (OTC)", base: 0.8850, payout: 85, digits: 5, desc: "ABD Doları / İsviçre Frangı" },
  { label: "NZD/USD (OTC)", base: 0.6050, payout: 85, digits: 5, desc: "Yeni Zelanda Doları / ABD Doları" },
  { label: "EUR/GBP (OTC)", base: 0.8580, payout: 85, digits: 5, desc: "Euro / İngiliz Sterlini" },
  { label: "EUR/JPY (OTC)", base: 163.00, payout: 85, digits: 3, desc: "Euro / Japon Yeni" },
  { label: "GBP/JPY (OTC)", base: 190.00, payout: 85, digits: 3, desc: "İngiliz Sterlini / Japon Yeni" },
  { label: "AUD/CAD (OTC)", base: 0.9900, payout: 87, digits: 5, desc: "Avustralya Doları / Kanada Doları" },
  { label: "AUD/CHF (OTC)", base: 0.5520, payout: 87, digits: 5, desc: "Avustralya Doları / İsviçre Frangı" },
  { label: "AUD/JPY (OTC)", base: 97.20, payout: 87, digits: 3, desc: "Avustralya Doları / Japon Yeni" },
  { label: "AUD/NZD (OTC)", base: 1.0820, payout: 87, digits: 5, desc: "Avustralya Doları / Yeni Zelanda Doları" },
  { label: "CAD/CHF (OTC)", base: 0.6080, payout: 87, digits: 5, desc: "Kanada Doları / İsviçre Frangı" },
];

export const ASSET_DIGITS: Record<string, number> = {
  "EUR/USD": 5,
  "EUR/USD (OTC)": 5,
  "GBP/USD": 5,
  "GBP/USD (OTC)": 5,
  "USD/JPY": 3,
  "USD/JPY (OTC)": 3,
  "USD/CAD": 5,
  "USD/CAD (OTC)": 5,
  "AUD/USD": 5,
  "AUD/USD (OTC)": 5,
  "USD/CHF": 5,
  "USD/CHF (OTC)": 5,
  "NZD/USD": 5,
  "NZD/USD (OTC)": 5,
  "EUR/GBP": 5,
  "EUR/GBP (OTC)": 5,
  "EUR/JPY": 3,
  "EUR/JPY (OTC)": 3,
  "GBP/JPY": 3,
  "GBP/JPY (OTC)": 3,
  "AUD/CAD": 5,
  "AUD/CAD (OTC)": 5,
  "AUD/CHF": 5,
  "AUD/CHF (OTC)": 5,
  "AUD/JPY": 3,
  "AUD/JPY (OTC)": 3,
  "AUD/NZD": 5,
  "AUD/NZD (OTC)": 5,
  "CAD/CHF": 5,
  "CAD/CHF (OTC)": 5,
};
