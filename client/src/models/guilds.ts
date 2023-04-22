export type Guild = {
  id: string
  name: string
  icon: string | null
  members: string[]
  channels: string[]
  bans: string[]
  roles: string[]
  banner: string | null
  description: string | null
  verificationLevel: number
  vanityURLCode: string | null
  nsfwLevel: number
  premiumSubscriptionCount: number
  discoverySplash: string | null
  memberCount: number
  large: false
  premiumProgressBarEnabled: false
  applicationId: string | null
  afkTimeout: number
  afkChannelId: string | null
  systemChannelId: string
  premiumTier: number
  explicitContentFilter: number
  mfaLevel: number
  joinedTimestamp: number
  defaultMessageNotifications: number
  systemChannelFlags: number
  maximumMembers: number
  rulesChannelId: string | null
  publicUpdatesChannelId: string | null
  preferredLocale: string
  ownerId: string
  createdTimestamp: number
  nameAcronym: string
  iconURL: string | null
  splashURL: string | null
  discoverySplashURL: string | null
  bannerURL: string | null
}
