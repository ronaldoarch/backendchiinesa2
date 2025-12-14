import { useEffect, useState } from "react";
import { api } from "../services/api";

declare global {
  interface Window {
    utmfy?: {
      track: (event: string, data?: Record<string, unknown>) => void;
      identify: (userId: string, traits?: Record<string, unknown>) => void;
    };
  }
}

export function UtmfyTracker() {
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    // Carregar API Key do backend
    const loadApiKey = async () => {
      try {
        const res = await api.get<Record<string, string>>("/settings");
        const key = res.data["tracking.utmfyApiKey"];
        if (key) {
          setApiKey(key);
        }
      } catch (error) {
        console.error("Erro ao carregar UTMfy API Key:", error);
      }
    };
    loadApiKey();
  }, []);

  useEffect(() => {
    if (!apiKey) return;

    // Capturar UTMs da URL
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get("utm_source");
    const utmMedium = urlParams.get("utm_medium");
    const utmCampaign = urlParams.get("utm_campaign");
    const utmTerm = urlParams.get("utm_term");
    const utmContent = urlParams.get("utm_content");

    if (utmSource || utmMedium || utmCampaign) {
      const utmData: Record<string, string> = {};
      if (utmSource) utmData.utm_source = utmSource;
      if (utmMedium) utmData.utm_medium = utmMedium;
      if (utmCampaign) utmData.utm_campaign = utmCampaign;
      if (utmTerm) utmData.utm_term = utmTerm;
      if (utmContent) utmData.utm_content = utmContent;

      // Salvar UTMs no localStorage para persistência
      localStorage.setItem("utm_params", JSON.stringify(utmData));
      
      // Enviar UTMs para o backend via API (se configurado)
      if (apiKey) {
        try {
          // Enviar para endpoint de tracking do backend
          fetch(`https://api.utmfy.com/track`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              event: "page_view",
              ...utmData,
              page: window.location.pathname,
              referrer: document.referrer,
              timestamp: new Date().toISOString()
            })
          }).catch(() => {
            // Silenciosamente falhar se não conseguir enviar
          });
        } catch (e) {
          console.error("Erro ao enviar UTMs para UTMfy:", e);
        }
      }
    } else {
      // Tentar recuperar UTMs salvos
      const savedUtms = localStorage.getItem("utm_params");
      if (savedUtms && apiKey) {
        try {
          const utmData = JSON.parse(savedUtms);
          fetch(`https://api.utmfy.com/track`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              event: "page_view",
              ...utmData,
              page: window.location.pathname,
              timestamp: new Date().toISOString()
            })
          }).catch(() => {
            // Silenciosamente falhar
          });
        } catch (e) {
          console.error("Erro ao parsear UTMs salvos:", e);
        }
      }
    }
  }, [apiKey]);

  // Observar mudanças de rota para tracking
  useEffect(() => {
    if (!apiKey || !window.utmfy) return;

    const handleRouteChange = () => {
      const savedUtms = localStorage.getItem("utm_params");
      if (savedUtms) {
        try {
          const utmData = JSON.parse(savedUtms);
          window.utmfy?.track("page_view", {
            ...utmData,
            page: window.location.pathname
          });
        } catch (e) {
          console.error("Erro ao parsear UTMs salvos:", e);
        }
      }
    };

    // Escutar mudanças de popstate (navegação do React Router)
    window.addEventListener("popstate", handleRouteChange);
    
    // Observar mudanças no pathname
    let lastPathname = window.location.pathname;
    const checkPathname = () => {
      if (window.location.pathname !== lastPathname) {
        lastPathname = window.location.pathname;
        handleRouteChange();
      }
    };
    const interval = setInterval(checkPathname, 100);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      clearInterval(interval);
    };
  }, [apiKey]);

  return null;
}

/**
 * Funções auxiliares para eventos do UTMfy
 */
export const utmfy = {
  track: (event: string, data?: Record<string, unknown>) => {
    if (typeof window !== "undefined" && window.utmfy) {
      window.utmfy.track(event, data);
    }
  },
  identify: (userId: string, traits?: Record<string, unknown>) => {
    if (typeof window !== "undefined" && window.utmfy) {
      window.utmfy.identify(userId, traits);
    }
  }
};

