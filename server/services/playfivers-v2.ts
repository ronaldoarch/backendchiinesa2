import axios, { AxiosInstance } from "axios";

// Configurações da API PlayFivers
const PLAYFIVERS_BASE_URL =
  process.env.PLAYFIVERS_BASE_URL ?? "https://api.playfivers.com/api";

// Credenciais do agente
const AGENT_ID = process.env.PLAYFIVERS_AGENT_ID ?? "";
const AGENT_SECRET = process.env.PLAYFIVERS_AGENT_SECRET ?? "";
const AGENT_TOKEN = process.env.PLAYFIVERS_AGENT_TOKEN ?? "";

// Método de autenticação (api_key, bearer, agent)
const AUTH_METHOD = process.env.PLAYFIVERS_AUTH_METHOD ?? "bearer";

if (!AGENT_ID || !AGENT_TOKEN) {
  // eslint-disable-next-line no-console
  console.warn(
    "⚠️ Credenciais PlayFivers não configuradas. Configure no .env ou no painel admin."
  );
}

// Criar cliente com autenticação apropriada
function createClient(): AxiosInstance {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  // Configurar autenticação baseado no método
  switch (AUTH_METHOD.toLowerCase()) {
    case "api_key":
      headers["X-API-Key"] = AGENT_TOKEN;
      break;
    case "bearer":
      headers["Authorization"] = `Bearer ${AGENT_TOKEN}`;
      break;
    case "agent":
      // Autenticação será no body de cada requisição
      break;
    default:
      headers["Authorization"] = `Bearer ${AGENT_TOKEN}`;
  }

  return axios.create({
    baseURL: PLAYFIVERS_BASE_URL,
    headers,
    timeout: 15000
  });
}

const client = createClient();

// Tipos
type RegisterGamePayload = {
  providerExternalId: string;
  gameExternalId: string;
  name: string;
};

type PlayFiversResponse<T = unknown> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

// Serviço PlayFivers
export const playFiversService = {
  /**
   * Registrar jogo na PlayFivers
   * ATENÇÃO: Ajuste o endpoint e payload conforme documentação oficial
   */
  async registerGame(
    payload: RegisterGamePayload
  ): Promise<PlayFiversResponse> {
    try {
      // Preparar dados conforme método de autenticação
      const requestData: Record<string, unknown> =
        AUTH_METHOD === "agent"
          ? {
              agent_id: AGENT_ID,
              agent_secret: AGENT_SECRET,
              provider_id: payload.providerExternalId,
              game_id: payload.gameExternalId,
              name: payload.name
            }
          : {
              provider_id: payload.providerExternalId,
              game_id: payload.gameExternalId,
              name: payload.name
            };

      // Tentar múltiplos endpoints possíveis
      const endpoints = [
        "/v1/games",
        "/games",
        "/casino/games",
        "/api/v1/games"
      ];

      let lastError: Error | null = null;

      for (const endpoint of endpoints) {
        try {
          const { data } = await client.post(endpoint, requestData);
          
          // eslint-disable-next-line no-console
          console.log(`✅ Jogo registrado com sucesso: ${payload.name}`);
          
          return {
            success: true,
            data,
            message: "Jogo registrado com sucesso"
          };
        } catch (error: any) {
          lastError = error;
          
          // Se for 404, tentar próximo endpoint
          if (error.response?.status === 404) {
            continue;
          }
          
          // Se for outro erro, não tentar mais endpoints
          break;
        }
      }

      // Se chegou aqui, todos endpoints falharam
      throw lastError;
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("❌ Erro ao registrar jogo na PlayFivers:", error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: "Erro ao registrar jogo"
      };
    }
  },

  /**
   * Registrar provedor na PlayFivers
   */
  async registerProvider(
    providerExternalId: string,
    providerName: string
  ): Promise<PlayFiversResponse> {
    try {
      const requestData: Record<string, unknown> =
        AUTH_METHOD === "agent"
          ? {
              agent_id: AGENT_ID,
              agent_secret: AGENT_SECRET,
              provider_id: providerExternalId,
              name: providerName
            }
          : {
              provider_id: providerExternalId,
              name: providerName
            };

      const { data } = await client.post("/v1/providers", requestData);

      return {
        success: true,
        data,
        message: "Provedor registrado com sucesso"
      };
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("❌ Erro ao registrar provedor:", error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: "Erro ao registrar provedor"
      };
    }
  },

  /**
   * Testar conexão com a API
   */
  async testConnection(): Promise<PlayFiversResponse> {
    try {
      const { data } = await client.get("/health");

      return {
        success: true,
        data,
        message: "Conexão OK"
      };
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("❌ Erro ao testar conexão:", error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: "Falha na conexão"
      };
    }
  },

  /**
   * Obter lista de jogos disponíveis
   */
  async getAvailableGames(
    providerId?: string
  ): Promise<PlayFiversResponse<any[]>> {
    try {
      const params = providerId ? { provider_id: providerId } : {};
      const { data } = await client.get("/v1/games", { params });

      return {
        success: true,
        data: data.games || data,
        message: "Jogos obtidos com sucesso"
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: "Erro ao obter jogos"
      };
    }
  }
};

