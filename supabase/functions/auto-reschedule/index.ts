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
    const { commitmentId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get the skipped commitment
    const { data: commitment } = await supabase
      .from('commitments')
      .select('*')
      .eq('id', commitmentId)
      .single();

    if (!commitment) throw new Error('Commitment not found');

    // Get user's completion patterns
    const { data: patterns } = await supabase
      .from('commitment_patterns')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Get upcoming commitments for next 7 days
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const { data: upcomingCommitments } = await supabase
      .from('commitments')
      .select('commitment_date, commitment_time')
      .eq('user_id', user.id)
      .gte('commitment_date', new Date().toISOString().split('T')[0])
      .lte('commitment_date', nextWeek.toISOString().split('T')[0])
      .order('commitment_date');

    const busySlots = upcomingCommitments?.map(c => 
      `${c.commitment_date} at ${c.commitment_time}`
    ).join(', ') || 'None';

    const prompt = `Suggest a new time for this skipped commitment.

Commitment: "${commitment.title}"
Original: ${commitment.commitment_date} at ${commitment.commitment_time}

User Patterns:
- Typical completion hour: ${patterns?.typical_completion_hour ?? 'Unknown'}
- Completion rate: ${patterns?.average_completion_rate ?? 0}%

Busy slots in next 7 days: ${busySlots}

Suggest:
1. New date (YYYY-MM-DD format, within next 7 days)
2. New time (HH:MM format, prefer user's typical hour)
3. Reasoning (max 100 words)

Avoid busy slots and consider user's patterns.`;

    console.log('Getting reschedule suggestion for:', commitmentId);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an AI scheduling assistant. Respond with JSON only.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'suggest_reschedule',
            description: 'Suggest a new time for the commitment',
            parameters: {
              type: 'object',
              properties: {
                suggested_date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
                suggested_time: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
                reasoning: { type: 'string', maxLength: 200 }
              },
              required: ['suggested_date', 'suggested_time', 'reasoning'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'suggest_reschedule' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No tool call in AI response');

    const suggestion = JSON.parse(toolCall.function.arguments);

    // Store reschedule suggestion
    await supabase.from('commitment_reschedules').insert({
      commitment_id: commitmentId,
      user_id: user.id,
      original_date: commitment.commitment_date,
      original_time: commitment.commitment_time,
      suggested_date: suggestion.suggested_date,
      suggested_time: suggestion.suggested_time,
      reason: suggestion.reasoning
    });

    return new Response(JSON.stringify(suggestion), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in auto-reschedule:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
