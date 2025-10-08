import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    console.log('Analyzing behavior patterns for user:', user.id);

    // Get all completed commitments
    const { data: completedCommitments } = await supabase
      .from('commitments')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!completedCommitments || completedCommitments.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'Not enough data yet. Complete more commitments!',
        patterns: null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate completion hour pattern
    const completionHours = completedCommitments.map(c => {
      const [hours] = c.commitment_time.split(':');
      return parseInt(hours);
    });

    const hourCounts = completionHours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const typicalHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0][0];

    // Calculate completion rate
    const { data: allCommitments } = await supabase
      .from('commitments')
      .select('completed')
      .eq('user_id', user.id);

    const completionRate = allCommitments 
      ? (allCommitments.filter(c => c.completed).length / allCommitments.length)
      : 0;

    // Calculate preferred days (day of week analysis)
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayCounts = completedCommitments.reduce((acc, c) => {
      const day = dayNames[new Date(c.commitment_date).getDay()];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const preferredDays = Object.entries(dayCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([day]) => day);

    const patterns = {
      typical_completion_hour: parseInt(typicalHour),
      preferred_days: preferredDays,
      average_completion_rate: parseFloat(completionRate.toFixed(2))
    };

    // Upsert patterns
    const { data: existing } = await supabase
      .from('commitment_patterns')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('commitment_patterns')
        .update({ ...patterns, last_updated: new Date().toISOString() })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('commitment_patterns')
        .insert({ ...patterns, user_id: user.id });
    }

    return new Response(JSON.stringify({ 
      message: 'Behavior patterns analyzed successfully',
      patterns 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in analyze-behavior:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
