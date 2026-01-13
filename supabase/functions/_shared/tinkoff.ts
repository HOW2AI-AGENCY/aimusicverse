/**
 * Tinkoff Acquiring API SDK
 * Documentation: https://www.tinkoff.ru/kassa/develop/api/payments/
 */

// Tinkoff API endpoints
export const TINKOFF_API_URL = 'https://securepay.tinkoff.ru/v2';

// Types
export interface TinkoffInitRequest {
  TerminalKey: string;
  Amount: number; // в копейках
  OrderId: string;
  Description?: string;
  Token?: string;
  SuccessURL?: string;
  FailURL?: string;
  NotificationURL?: string;
  PayType?: 'O' | 'T'; // O - одностадийная, T - двухстадийная
  Language?: 'ru' | 'en';
  Recurrent?: 'Y';  // Для рекуррентных платежей
  CustomerKey?: string;  // Идентификатор покупателя для рекуррента
  Receipt?: TinkoffReceipt;
  DATA?: Record<string, string>;
}

export interface TinkoffInitResponse {
  Success: boolean;
  ErrorCode: string;
  Message?: string;
  Details?: string;
  TerminalKey: string;
  Amount: number;
  OrderId: string;
  PaymentId?: string;
  PaymentURL?: string;
}

export interface TinkoffNotification {
  TerminalKey: string;
  OrderId: string;
  Success: boolean;
  Status: TinkoffPaymentStatus;
  PaymentId: number;
  ErrorCode: string;
  Amount: number;
  CardId?: number;
  Pan?: string;
  ExpDate?: string;
  RebillId?: string;  // ID для автосписания
  Token: string;
}

export type TinkoffPaymentStatus = 
  | 'NEW'
  | 'FORM_SHOWED'
  | 'AUTHORIZING'
  | 'AUTHORIZED'
  | 'CONFIRMING'
  | 'CONFIRMED'
  | 'REVERSING'
  | 'PARTIAL_REVERSED'
  | 'REVERSED'
  | 'REFUNDING'
  | 'PARTIAL_REFUNDED'
  | 'REFUNDED'
  | 'REJECTED'
  | 'DEADLINE_EXPIRED'
  | 'CANCELED';

export interface TinkoffReceipt {
  Email?: string;
  Phone?: string;
  Taxation: 'osn' | 'usn_income' | 'usn_income_outcome' | 'envd' | 'esn' | 'patent';
  Items: TinkoffReceiptItem[];
}

export interface TinkoffReceiptItem {
  Name: string;
  Price: number; // в копейках
  Quantity: number;
  Amount: number; // Price * Quantity
  PaymentMethod?: 'full_prepayment' | 'prepayment' | 'advance' | 'full_payment' | 'partial_payment' | 'credit' | 'credit_payment';
  PaymentObject?: 'commodity' | 'excise' | 'job' | 'service' | 'gambling_bet' | 'gambling_prize' | 'lottery' | 'lottery_prize' | 'intellectual_activity' | 'payment' | 'agent_commission' | 'composite' | 'another';
  Tax: 'none' | 'vat0' | 'vat10' | 'vat20' | 'vat110' | 'vat120';
}

// Recurrent payment types
export interface TinkoffChargeRequest {
  TerminalKey: string;
  PaymentId: string;
  RebillId: string;
  Token?: string;
  SendEmail?: boolean;
  InfoEmail?: string;
}

export interface TinkoffChargeResponse {
  Success: boolean;
  ErrorCode: string;
  Message?: string;
  Details?: string;
  TerminalKey: string;
  Amount: number;
  OrderId: string;
  PaymentId: string;
  Status: TinkoffPaymentStatus;
}

/**
 * Generate Tinkoff Token (SHA-256 signature)
 * 
 * Algorithm:
 * 1. Add Password to params
 * 2. Sort params alphabetically by key
 * 3. Concatenate all values (excluding Token, Receipt, DATA)
 * 4. SHA-256 hash the result
 */
export async function generateTinkoffToken(
  params: Record<string, unknown>,
  password: string
): Promise<string> {
  // Create a copy and add password
  const signParams: Record<string, unknown> = { ...params, Password: password };
  
  // Keys to exclude from signature
  const excludeKeys = ['Token', 'Receipt', 'DATA'];
  
  // Filter, sort by key, and concatenate values
  const sortedKeys = Object.keys(signParams)
    .filter(key => !excludeKeys.includes(key))
    .sort();
  
  const concatenated = sortedKeys
    .map(key => String(signParams[key] ?? ''))
    .join('');
  
  // SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(concatenated);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Verify Tinkoff notification token
 */
export async function verifyTinkoffToken(
  notification: TinkoffNotification,
  password: string
): Promise<boolean> {
  const receivedToken = notification.Token;
  
  // Remove Token from params for verification
  const paramsWithoutToken = { ...notification };
  delete (paramsWithoutToken as Record<string, unknown>).Token;
  
  const calculatedToken = await generateTinkoffToken(paramsWithoutToken, password);
  
  return receivedToken.toLowerCase() === calculatedToken.toLowerCase();
}

/**
 * Initialize Tinkoff payment
 */
export async function initTinkoffPayment(
  request: TinkoffInitRequest
): Promise<TinkoffInitResponse> {
  const response = await fetch(`${TINKOFF_API_URL}/Init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error(`Tinkoff API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Charge recurrent payment (автосписание)
 */
export async function chargeTinkoffRecurrent(
  request: TinkoffChargeRequest
): Promise<TinkoffChargeResponse> {
  const response = await fetch(`${TINKOFF_API_URL}/Charge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error(`Tinkoff Charge API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Generate unique order ID for Tinkoff
 */
export function generateOrderId(prefix = 'MV'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Map Tinkoff status to our payment status
 */
export function mapTinkoffStatus(tinkoffStatus: TinkoffPaymentStatus): 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' {
  switch (tinkoffStatus) {
    case 'NEW':
    case 'FORM_SHOWED':
      return 'pending';
    case 'AUTHORIZING':
    case 'AUTHORIZED':
    case 'CONFIRMING':
      return 'processing';
    case 'CONFIRMED':
      return 'completed';
    case 'REJECTED':
    case 'DEADLINE_EXPIRED':
      return 'failed';
    case 'CANCELED':
    case 'REVERSING':
    case 'REVERSED':
    case 'PARTIAL_REVERSED':
      return 'cancelled';
    case 'REFUNDING':
    case 'REFUNDED':
    case 'PARTIAL_REFUNDED':
      return 'refunded';
    default:
      return 'pending';
  }
}
