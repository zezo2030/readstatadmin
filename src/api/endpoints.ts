import { request } from './client';
import type {
  AppSettings,
  AppSettingsUpdate,
  Banner,
  BannerCreate,
  BannerUpdate,
  BlockedIdentity,
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
  search?: string;
  id?: string;
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

// ---- media (presigned upload) ----
type IssueUploadsResponse = {
  uploads: { objectKey: string; uploadUrl: string; expiresAt: string }[];
};

/**
 * Upload a single file via the presigned-PUT flow and return its object key.
 * Used for banner images (mirrors the mobile app's uploader).
 */
export const uploadImage = async (file: File): Promise<string> => {
  const { uploads } = await request<IssueUploadsResponse>(
    'post',
    '/media/uploads',
    { data: { items: [{ contentType: file.type, sizeBytes: file.size }] } },
  );
  const target = uploads[0];
  const put = await fetch(target.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!put.ok) {
    throw new Error(`Upload failed (${put.status})`);
  }
  return target.objectKey;
};

// ---- banners ----
export const listBanners = () =>
  request<{ items: Banner[] }>('get', '/admin/banners');

export const createBanner = (body: BannerCreate) =>
  request<Banner>('post', '/admin/banners', { data: body });

export const updateBanner = (id: string, body: BannerUpdate) =>
  request<Banner>('patch', `/admin/banners/${id}`, { data: body });

export const deleteBanner = (id: string) =>
  request<void>('delete', `/admin/banners/${id}`);

export const reorderBanners = (items: { id: string; sortOrder: number }[]) =>
  request<{ items: Banner[] }>('patch', '/admin/banners/reorder', {
    data: { items },
  });

// ---- settings ----
export const getSettings = () => request<AppSettings>('get', '/admin/settings');

export const updateSettings = (body: AppSettingsUpdate) =>
  request<AppSettings>('patch', '/admin/settings', { data: body });

// ---- blocked identities ----
export const listBlockedIdentities = () =>
  request<{ items: BlockedIdentity[] }>('get', '/admin/blocked-identities');

export const unblockIdentity = (id: string) =>
  request<void>('delete', `/admin/blocked-identities/${id}`);

// ---- owner password (super-admin only) ----
export const changeOwnerPassword = (body: {
  currentPassword: string;
  newPassword: string;
}) => request<void>('post', '/auth/me/change-password', { data: body });
