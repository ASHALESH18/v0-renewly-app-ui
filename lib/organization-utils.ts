/**
 * Enterprise Organization Management Utilities
 * Handles organization and member operations
 */

export interface Organization {
  id: string
  owner_user_id: string
  name: string
  plan: 'enterprise'
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id?: string
  email?: string
  role: 'owner' | 'admin' | 'member'
  status: 'invited' | 'active'
  created_at: string
  updated_at: string
}

export interface OrganizationSettings {
  organization_id: string
  shared_alerts: boolean
  shared_calendar: boolean
  created_at: string
  updated_at: string
}

/**
 * Check if a user is an organization owner
 */
export function isOrganizationOwner(
  member: OrganizationMember,
  organization: Organization
): boolean {
  return member.role === 'owner' || member.user_id === organization.owner_user_id
}

/**
 * Check if a user can manage organization
 */
export function canManageOrganization(member: OrganizationMember): boolean {
  return member.role === 'owner' || member.role === 'admin'
}

/**
 * Check if a user can manage members
 */
export function canManageMembers(member: OrganizationMember): boolean {
  return member.role === 'owner' || member.role === 'admin'
}

/**
 * Validate member email
 */
export function validateMemberEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Format organization name for display
 */
export function formatOrganizationName(name: string): string {
  return name.trim().length > 0 ? name : 'Unnamed Organization'
}

/**
 * Get role display label
 */
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Administrator',
    member: 'Member',
  }
  return labels[role] || role
}

/**
 * Get member status label
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    invited: 'Invited',
    active: 'Active',
  }
  return labels[status] || status
}

/**
 * Calculate organization member statistics
 */
export function getOrganizationStats(members: OrganizationMember[]): {
  total: number
  active: number
  invited: number
  admins: number
} {
  return {
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    invited: members.filter(m => m.status === 'invited').length,
    admins: members.filter(m => m.role === 'admin' || m.role === 'owner').length,
  }
}

/**
 * Generate invitation link for a member
 */
export function generateInvitationLink(
  organizationId: string,
  invitationToken?: string
): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://renewly.io'
  
  const params = new URLSearchParams({
    org: organizationId,
    ...(invitationToken && { token: invitationToken }),
  })
  
  return `${baseUrl}/join-organization?${params.toString()}`
}

/**
 * Format member display name
 */
export function formatMemberName(member: OrganizationMember): string {
  if (member.user_id) {
    // Full user - name would come from profile
    return 'Team Member'
  }
  return member.email || 'Invited Member'
}
