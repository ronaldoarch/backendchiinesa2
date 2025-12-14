import { useEffect } from "react";

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

type FacebookPixelProps = {
  pixelId?: string;
};

export function FacebookPixel({ pixelId }: FacebookPixelProps) {
  useEffect(() => {
    if (!pixelId) return;

    // Carregar script do Facebook Pixel
    const script = document.createElement("script");
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    // Cleanup
    return () => {
      const existingScript = document.querySelector('script[src*="fbevents.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [pixelId]);

  return null;
}

/**
 * Funções auxiliares para eventos do Facebook Pixel
 */
export const fbq = {
  track: (event: string, data?: Record<string, unknown>) => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", event, data);
    }
  },
  trackCustom: (event: string, data?: Record<string, unknown>) => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("trackCustom", event, data);
    }
  }
};

