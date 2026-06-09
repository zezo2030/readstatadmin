import type { components } from './schema';

type Schemas = components['schemas'];

export type Role = Schemas['Role'];
export type AuthSession = Schemas['AuthSession'];
export type UserSelf = Schemas['UserSelf'];
export type UserAdminView = Schemas['UserAdminView'];
export type Property = Schemas['Property'];
export type PropertyUpdate = Schemas['PropertyUpdate'];
export type PropertyRequest = Schemas['PropertyRequest'];
export type PropertyRequestUpdate = Schemas['PropertyRequestUpdate'];
export type Report = Schemas['Report'];
export type Location = Schemas['Location'];
export type Stats = Schemas['Stats'];
export type Banner = Schemas['Banner'];
export type BannerCreate = Schemas['BannerCreate'];
export type BannerUpdate = Schemas['BannerUpdate'];
export type BannerLinkType = Schemas['BannerLinkType'];
export type AppSettings = Schemas['AppSettings'];
export type AppSettingsUpdate = Schemas['AppSettingsUpdate'];
export type BlockedIdentity = Schemas['BlockedIdentity'];

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
export type AvailabilityStatus = 'available' | 'reserved' | 'sold' | 'rented';
export type RequestStatus = 'open' | 'in_progress' | 'closed';
export type ReportStatus = 'open' | 'resolved' | 'dismissed';
export type ReportTargetType = 'property' | 'user' | 'broker';
export type ReportResolveAction = 'none' | 'disabled_account' | 'deleted_listing';
export type BroadcastAudience = 'all' | 'regular_users' | 'brokers';
