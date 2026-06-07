import type { components } from './schema';

type Schemas = components['schemas'];

export type Role = Schemas['Role'];
export type AuthSession = Schemas['AuthSession'];
export type UserSelf = Schemas['UserSelf'];
export type UserAdminView = Schemas['UserAdminView'];
export type Property = Schemas['Property'];
export type PropertyRequest = Schemas['PropertyRequest'];
export type Report = Schemas['Report'];
export type Location = Schemas['Location'];
export type Stats = Schemas['Stats'];

export type PageInfo = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type OffsetPage<T> = {
  items: T[];
  pageInfo: PageInfo;
};

export type ModerationStatus = 'active' | 'pending_review' | 'rejected';
export type RequestStatus = 'open' | 'in_progress' | 'closed';
export type ReportStatus = 'open' | 'resolved' | 'dismissed';
export type ReportTargetType = 'property' | 'user' | 'broker';
export type ReportResolveAction = 'none' | 'disabled_account' | 'deleted_listing';
export type BroadcastAudience = 'all' | 'regular_users' | 'brokers';
