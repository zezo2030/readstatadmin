import { request } from './client';
import type {
  BroadcastAudience,
  Location,
  ModerationStatus,
  OffsetPage,
  Property,
  PropertyRequest,
  Report,
  ReportResolveAction,
  ReportStatus,
  ReportTargetType,
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

// ---- reports ----
export type ReportsQuery = {
  page?: number;
  pageSize?: number;
  status?: ReportStatus;
  targetType?: ReportTargetType;
};
export const listReports = (params: ReportsQuery) =>
  request<OffsetPage<Report>>('get', `/admin/reports${qs(params)}`);

export const resolveReport = (
  id: string,
  body: {
    outcome: 'resolved' | 'dismissed';
    action?: ReportResolveAction;
    note?: string;
  },
) => request<Report>('post', `/admin/reports/${id}/resolve`, { data: body });

// ---- locations ----
// Public read endpoints return only *active* locations.
export const listCities = () =>
  request<Location[]>('get', '/locations/cities');
export const listAreas = (cityId: string) =>
  request<Location[]>('get', `/locations/cities/${cityId}/areas`);

export const createCity = (body: { name: string; slug: string }) =>
  request<Location>('post', '/admin/locations/cities', { data: body });
export const createArea = (body: {
  parentId: string;
  name: string;
  slug: string;
}) => request<Location>('post', '/admin/locations/areas', { data: body });
export const updateLocation = (
  id: string,
  body: { name?: string; slug?: string; isActive?: boolean },
) => request<Location>('patch', `/admin/locations/${id}`, { data: body });
export const deleteLocation = (id: string) =>
  request<void>('delete', `/admin/locations/${id}`);

// ---- broadcast ----
export const sendBroadcast = (body: {
  audience: BroadcastAudience;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) => request<void>('post', '/admin/notifications/broadcast', { data: body });
