import { supabase } from "@/integrations/supabase/client";

export const scheduleContributionReminders = async () => {
  try {
    console.log("Scheduling contribution reminders...");
    const { data: contributions, error } = await supabase
      .from('contributions')
      .select(`
        id,
        amount,
        due_date,
        memberships (
          user_id,
          profiles (
            full_name
          )
        )
      `)
      .eq('status', 'pending')
      .gte('due_date', new Date().toISOString())
      .lte('due_date', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    // Process reminders in batches
    const batchSize = 100;
    for (let i = 0; i < contributions.length; i += batchSize) {
      const batch = contributions.slice(i, i + batchSize);
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(
          batch.map(contribution => ({
            user_id: contribution.memberships.user_id,
            type: 'contribution_reminder',
            message: `Reminder: Your contribution of $${contribution.amount} is due on ${new Date(contribution.due_date).toLocaleDateString()}`
          }))
        );

      if (notificationError) {
        console.error("Error creating notifications:", notificationError);
      }
    }

    console.log(`Successfully scheduled ${contributions.length} reminders`);
  } catch (error) {
    console.error("Error scheduling reminders:", error);
  }
};

export const processPayouts = async () => {
  try {
    console.log("Processing scheduled payouts...");
    const { data: payouts, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_date', new Date().toISOString());

    if (error) throw error;

    for (const payout of payouts) {
      const { error: updateError } = await supabase
        .from('payouts')
        .update({
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', payout.id);

      if (updateError) {
        console.error(`Error updating payout ${payout.id}:`, updateError);
        continue;
      }

      // Trigger payout processing function
      const response = await fetch('/api/process-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payout),
      });

      if (!response.ok) {
        console.error(`Error processing payout ${payout.id}`);
      }
    }

    console.log(`Successfully processed ${payouts.length} payouts`);
  } catch (error) {
    console.error("Error processing payouts:", error);
  }
};