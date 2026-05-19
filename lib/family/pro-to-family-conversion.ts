/**
 * Combo 3: Pro to Family Conversion
 * Handles transition of Pro users becoming Family members
 */

/**
 * Convert Pro user to Family member on invite acceptance
 * 
 * Steps:
 * 1. Archive Pro subscription (set status to 'cancelled', covered_by_family = true)
 * 2. Create Family covered member row
 * 3. Emit notification
 * 4. Return conversion result
 */
export async function convertProToFamilyMember(
  supabase: any,
  userId: string,
  familyGroupId: string,
  invitedEmail: string,
  seatType: 'included' | 'extra'
): Promise<{ success: boolean; error?: string; conversions?: any[] }> {
  try {
    // Find and archive active Pro subscription
    const { data: proSubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, name, amount, billing_cycle')
      .eq('user_id', userId)
      .eq('plan', 'pro')
      .eq('status', 'active')

    if (fetchError) {
      return { success: false, error: `Failed to fetch Pro subscriptions: ${fetchError.message}` }
    }

    const conversions = []

    // Archive each active Pro subscription
    if (proSubscriptions && proSubscriptions.length > 0) {
      for (const proSub of proSubscriptions) {
        // Update Pro subscription to archived/cancelled
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            covered_by_family: true,
            family_group_id: familyGroupId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', proSub.id)

        if (updateError) {
          console.warn(`[v0] Failed to archive Pro subscription ${proSub.id}:`, updateError)
        } else {
          conversions.push({
            subscriptionId: proSub.id,
            name: proSub.name,
            amount: proSub.amount,
            billingCycle: proSub.billing_cycle,
          })
        }
      }
    }

    // Create Family member entry with ₹0 amount (covered)
    const { data: familyMember, error: memberError } = await supabase
      .from('family_members')
      .insert({
        user_id: userId,
        family_group_id: familyGroupId,
        email: invitedEmail,
        role: 'member',
        status: 'active',
        seat_type: seatType,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (memberError) {
      return { success: false, error: `Failed to create family member: ${memberError.message}` }
    }

    // Also create a ₹0 covered subscription entry for tracking
    const { error: coveredSubError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        name: 'Family Coverage (via Pro)',
        status: 'active',
        plan: 'family',
        amount: 0,
        billing_cycle: 'yearly',
        currency: 'INR',
        covered_by_family: true,
        family_group_id: familyGroupId,
        is_system_managed: true,
        system_source: 'family_conversion',
        system_metadata: {
          convertedFromProAt: new Date().toISOString(),
          originalProSubscriptions: conversions,
          seatType,
        },
      })

    if (coveredSubError) {
      console.warn('[v0] Warning: Failed to create covered subscription entry:', coveredSubError)
      // Don't fail the whole conversion, this is just tracking
    }

    return {
      success: true,
      conversions,
    }
  } catch (error) {
    console.error('[v0] Error converting Pro to Family:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during conversion',
    }
  }
}

/**
 * Check if user has active Pro subscription
 */
export async function getUserActiveProSubscription(
  supabase: any,
  userId: string
): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, name, amount, billing_cycle, plan')
      .eq('user_id', userId)
      .eq('plan', 'pro')
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is expected
      console.warn('[v0] Error checking Pro subscription:', error)
      return null
    }

    return data || null
  } catch (error) {
    console.warn('[v0] Error in getUserActiveProSubscription:', error)
    return null
  }
}
