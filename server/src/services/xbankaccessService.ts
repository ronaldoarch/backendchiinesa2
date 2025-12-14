import axios, { AxiosInstance } from "axios";
import { pool } from "../config/database";
import { RowDataPacket } from "mysql2";

// Configurações da API XBankAccess
const XBANKACCESS_BASE_URL = process.env.XBANKACCESS_BASE_URL || "https://app.xbankaccess.com/api";

interface XBankAccessCredentials {
  token: string;
  secret: string;
}

interface SettingRow extends RowDataPacket {
  key: string;
  value: string;
}

/**
 * Buscar credenciais do XBankAccess do banco de dados
 */
async function getCredentialsFromDb(): Promise<Partial<XBankAccessCredentials>> {
  try {
    const [rows] = await pool.query<SettingRow[]>(
      "SELECT `key`, `value` FROM settings WHERE `key` LIKE 'xbankaccess.%'"
    );

    const credentials: Partial<XBankAccessCredentials> = {};

    for (const row of rows) {
      const key = row.key.replace("xbankaccess.", "");
      if (key === "token") credentials.token = row.value;
      if (key === "secret") credentials.secret = row.value;
    }

    return credentials;
  } catch (error) {
    console.error("Erro ao buscar credenciais XBankAccess do banco:", error);
    return {};
  }
}

/**
 * Obter credenciais (prioridade: env vars > banco de dados)
 */
async function getCredentials(): Promise<XBankAccessCredentials> {
  const dbCreds = await getCredentialsFromDb();

  return {
    token: process.env.XBANKACCESS_TOKEN || dbCreds.token || "",
    secret: process.env.XBANKACCESS_SECRET || dbCreds.secret || ""
  };
}

/**
 * Criar cliente HTTP com autenticação XBankAccess
 */
async function createClient(): Promise<AxiosInstance> {
  const creds = await getCredentials();

  if (!creds.token || !creds.secret) {
    throw new Error("Credenciais XBankAccess não configuradas. Configure XBANKACCESS_TOKEN e XBANKACCESS_SECRET.");
  }

  const client = axios.create({
    baseURL: XBANKACCESS_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    timeout: 30000
  });

  // Interceptor para log de requisições
  client.interceptors.request.use((config) => {
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(`[XBankAccess] ${config.method?.toUpperCase()} ${fullUrl}`);
    return config;
  });

  // Interceptor para log de respostas
  client.interceptors.response.use(
    (response) => {
      const fullUrl = `${response.config.baseURL}${response.config.url}`;
      console.log(`[XBankAccess] ✅ ${response.config.method?.toUpperCase()} ${fullUrl} - ${response.status}`);
      return response;
    },
    (error) => {
      const fullUrl = error.config?.baseURL && error.config?.url
        ? `${error.config.baseURL}${error.config.url}`
        : "unknown";
      console.error(`[XBankAccess] ❌ ${error.config?.method?.toUpperCase()} ${fullUrl} - ${error.response?.status || "NO_RESPONSE"}`, {
        error: error.response?.data || error.message
      });
      return Promise.reject(error);
    }
  );

  return client;
}

// Tipos de resposta da API XBankAccess
export type XBankAccessResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Tipos para PIX-IN (Receber pagamento)
export type XBankAccessPixInRequest = {
  token: string;
  secret: string;
  amount: number;
  debtor_name: string;
  email: string;
  debtor_document_number: string;
  phone: string;
  method_pay: "pix";
  postback: string;
};

export type XBankAccessPixInResponse = {
  idTransaction: string;
  qrcode: string; // Pix copia e cola
  qr_code_image_url: string; // Base64 da imagem do QR Code
};

// Tipos para PIX-OUT (Enviar pagamento)
export type XBankAccessPixOutRequest = {
  token: string;
  secret: string;
  amount: number;
  pixKey: string;
  pixKeyType: "cpf" | "email" | "telefone" | "aleatoria";
  baasPostbackUrl: string;
};

export type XBankAccessPixOutResponse = {
  id: string; // ID da transação
  amount: number;
  pixKey: string;
  pixKeyType: string;
  withdrawStatusId: string; // Ex: "PendingProcessing"
  createdAt: string;
  updatedAt: string;
};

// Serviço XBankAccess
export const xbankaccessService = {
  /**
   * Obter credenciais atuais
   */
  async getCredentials(): Promise<XBankAccessCredentials> {
    return await getCredentials();
  },

  /**
   * Criar pagamento PIX-IN (Receber pagamento)
   * POST /wallet/deposit/payment
   */
  async createPixInPayment(request: Omit<XBankAccessPixInRequest, "token" | "secret">): Promise<XBankAccessResponse<XBankAccessPixInResponse>> {
    try {
      const creds = await getCredentials();
      const client = await createClient();

      const payload: XBankAccessPixInRequest = {
        ...request,
        token: creds.token,
        secret: creds.secret,
        method_pay: "pix"
      };

      const { data } = await client.post<XBankAccessPixInResponse>("/wallet/deposit/payment", payload);

      console.log(`✅ Pagamento PIX-IN criado: ${data.idTransaction}`);
      console.log(`📋 QR Code (copia e cola): ${data.qrcode}`);
      console.log(`🖼️ QR Code Image URL: ${data.qr_code_image_url}`);
      console.log(`📦 Resposta completa:`, JSON.stringify(data, null, 2));

      return {
        success: true,
        data,
        message: "Pagamento PIX-IN criado com sucesso"
      };
    } catch (error: any) {
      console.error("❌ Erro ao criar pagamento PIX-IN:", error.message);

      if (error.response?.status === 401) {
        return {
          success: false,
          error: "Credenciais inválidas",
          message: "Verifique se as credenciais XBankAccess estão corretas"
        };
      }

      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || "Erro na solicitação";
        return {
          success: false,
          error: errorMsg,
          message: "Verifique os dados enviados"
        };
      }

      if (error.response?.status === 422) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || "Dados inválidos";
        return {
          success: false,
          error: errorMsg,
          message: "Dados inválidos na requisição"
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || error.message,
        message: "Erro ao criar pagamento PIX-IN"
      };
    }
  },

  /**
   * Criar pagamento PIX-OUT (Enviar pagamento/Saque)
   * POST /pixout
   */
  async createPixOutPayment(request: Omit<XBankAccessPixOutRequest, "token" | "secret">): Promise<XBankAccessResponse<XBankAccessPixOutResponse>> {
    try {
      const creds = await getCredentials();
      const client = await createClient();

      const payload: XBankAccessPixOutRequest = {
        ...request,
        token: creds.token,
        secret: creds.secret
      };

      const { data } = await client.post<XBankAccessPixOutResponse>("/pixout", payload);

      console.log(`✅ Pagamento PIX-OUT criado: ${data.id}`);

      return {
        success: true,
        data,
        message: "Pagamento PIX-OUT criado com sucesso"
      };
    } catch (error: any) {
      console.error("❌ Erro ao criar pagamento PIX-OUT:", error.message);

      if (error.response?.status === 401) {
        return {
          success: false,
          error: "Credenciais inválidas",
          message: "Verifique se as credenciais XBankAccess estão corretas"
        };
      }

      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || "Erro na solicitação";
        return {
          success: false,
          error: errorMsg,
          message: "Verifique os dados enviados"
        };
      }

      if (error.response?.status === 422) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || "Dados inválidos";
        return {
          success: false,
          error: errorMsg,
          message: "Dados inválidos na requisição"
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || error.message,
        message: "Erro ao criar pagamento PIX-OUT"
      };
    }
  },

  /**
   * Testar conexão com XBankAccess
   */
  async testConnection(): Promise<XBankAccessResponse> {
    try {
      const creds = await getCredentials();

      if (!creds.token || !creds.secret) {
        return {
          success: false,
          error: "Credenciais não configuradas",
          message: "Configure as credenciais XBankAccess antes de testar a conexão"
        };
      }

      return {
        success: true,
        message: "Credenciais configuradas corretamente"
      };
    } catch (error: any) {
      console.error("❌ Erro ao testar conexão com XBankAccess:", error);

      return {
        success: false,
        error: error.message || "Erro ao testar conexão",
        message: "Erro ao testar conexão com a API XBankAccess"
      };
    }
  }
};

