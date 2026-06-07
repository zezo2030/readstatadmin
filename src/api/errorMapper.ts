import axios, { type AxiosError } from 'axios';
import i18n from '@/i18n';

export type FailureCode =
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'tooManyRequests'
  | 'clientVersionUnsupported'
  | 'network'
  | 'unknown';

export class AppFailure extends Error {
  code: FailureCode;
  requestId?: string;
  status?: number;
  retryAfterSeconds?: number;
  /** Axios transport detail (e.g. ERR_NETWORK) — dev diagnostics only. */
  transportCode?: string;

  constructor(params: {
    code: FailureCode;
    message: string;
    requestId?: string;
    status?: number;
    retryAfterSeconds?: number;
    transportCode?: string;
  }) {
    super(params.message);
    this.name = 'AppFailure';
    this.code = params.code;
    this.requestId = params.requestId;
    this.status = params.status;
    this.retryAfterSeconds = params.retryAfterSeconds;
    this.transportCode = params.transportCode;
  }
}

const KNOWN_CODES: FailureCode[] = [
  'unauthorized',
  'forbidden',
  'notFound',
  'conflict',
  'tooManyRequests',
  'clientVersionUnsupported',
  'network',
  'unknown',
];

const localized = (code: FailureCode): string => i18n.t(`errors.${code}`);

const normalizeCode = (code: unknown, status?: number): FailureCode => {
  if (code === 'clientVersionUnsupported') {
    return 'clientVersionUnsupported';
  }
  if (typeof code === 'string' && (KNOWN_CODES as string[]).includes(code)) {
    return code as FailureCode;
  }
  switch (status) {
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'notFound';
    case 409:
      return 'conflict';
    case 429:
      return 'tooManyRequests';
    case 426:
      return 'clientVersionUnsupported';
    default:
      return status ? 'unknown' : 'network';
  }
};

type ErrorBody = {
  code?: unknown;
  message?: unknown;
  requestId?: unknown;
  retryAfterSeconds?: unknown;
};

export const mapError = (error: unknown): AppFailure => {
  if (error instanceof AppFailure) {
    return error;
  }
  const axiosError = error as AxiosError<ErrorBody>;
  const status = axiosError.response?.status;
  const body = axiosError.response?.data;
  const code = normalizeCode(body?.code, status);
  const transportCode = axios.isAxiosError(error) ? error.code : undefined;

  const headerRetry = (() => {
    const raw = axiosError.response?.headers?.['retry-after'];
    return typeof raw === 'string' ? Number.parseInt(raw, 10) : undefined;
  })();
  const bodyRetry =
    typeof body?.retryAfterSeconds === 'number'
      ? body.retryAfterSeconds
      : undefined;
  const retryAfterSeconds = Number.isFinite(bodyRetry)
    ? bodyRetry
    : Number.isFinite(headerRetry)
      ? headerRetry
      : undefined;

  // Prefer the backend's human message when present; fall back to localized copy.
  const message =
    typeof body?.message === 'string' && body.message.length > 0
      ? body.message
      : localized(code);

  const failure = new AppFailure({
    code,
    message,
    requestId: typeof body?.requestId === 'string' ? body.requestId : undefined,
    status,
    retryAfterSeconds,
    transportCode,
  });
  (failure as AppFailure & { config?: unknown }).config = axiosError.config;
  return failure;
};
