import { request } from './client';
import type {
  BroadcastAudience,
  ModerationStatus,
  OffsetPage,
  Property,
  PropertyRequest,
  RequestStatus,
  Role,
  Stats,
  UserAdminView,
} from './types';

const qs = (params: Record<string, unknown>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const s = search.toString();
  return s ? `?${s}` : '';
};

// ---- stats ----
export const getStats = () => request<Stats>('get', '/admin/stats');

// ---- users ----
export type UsersQuery = {
  page?: number;
  pageSize?: number;
  role?: Role;
  isActive?: boolean;
  q?: string;
};
export const listUsers = (params: UsersQuery) =>
  request<OffsetPage<UserAdminView>>('get', `/admin/users${qs(params)}`);

export const setUserStatus = (
  id: string,
  body: { isActive: boolean; reason?: string },
) => request<UserAdminView>('patch', `/admin/users/${id}/status`, { data: body });

export const approveBroker = (id: string) =>
  request<UserAdminView>('patch', `/admin/users/${id}/approve-broker`);

// ---- properties ----
export type PropertiesQuery = {
  page?: number;
  pageSize?: number;
  moderationStatus?: ModerationStatus;
};
export const listProperties = (params: PropertiesQuery) =>
  request<OffsetPage<Property>>('get', `/admin/properties${qs(params)}`);

export const moderateProperty = (
  id: string,
  body: { action: 'approve' | 'reject'; reason?: string },
) =>
  request<Property>('post', `/admin/properties/${id}/moderation`, {
    data: body,
  });

// ---- property requests ----
export type RequestsQuery = {
  page?: number;
  pageSize?: number;
  status?: RequestStatus;
};
export const listRequests = (params: RequestsQuery) =>
  request<OffsetPage<PropertyRequest>>(
    'get',
    `/admin/property-requests${qs(params)}`,
  );

// ---- broadcast ----
export const sendBroadcast = (body: {
  audience: BroadcastAudience;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) => request<void>('post', '/admin/notifications/broadcast', { data: body });
