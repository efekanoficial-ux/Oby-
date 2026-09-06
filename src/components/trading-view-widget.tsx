import { useEffect, useRef } from "react";

export function TradingViewWidget({ onLoad }: { onLoad?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Notify parent after a reasonable mount time
    const timer = setTimeout(() => {
      onLoad?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onLoad]);

  return (
    <div className="h-full w-full bg-black" ref={containerRef}>
      <iframe
        id="tradingview_widget"
        src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=BINANCE:BTCUSDT&interval=1&hidesidetoolbar=1&hidetoptoolbar=0&symboledit=1&saveimage=0&toolbarbg=161616&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=0&showpopupbutton=0&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=tr&utm_source=demo"
        className="h-full w-full border-0"
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
}
