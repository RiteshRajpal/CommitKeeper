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
    const { mood, energyLevel } = await req.json();
    
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

    // Get today's incomplete commitments
    const today = new Date().toISOString().split('T')[0];
    const { data: todayCommitments } = await supabase
      .from('commitments')
      .select('id, title, commitment_time')
      .eq('user_id', user.id)
      .eq('commitment_date', today)
      .eq('completed', false)
      .order('commitment_time');

    if (!todayCommitments || todayCommitments.length === 0) {
      return new Response(JSON.stringify({ 
        recommendations: [],
        message: 'No pending commitments for today!' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Based on the user's current mood and energy, recommend which commitments to tackle now.

User State:
- Mood: ${mood}
- Energy Level: ${energyLevel}/5

Available Commitments:
${todayCommitments.map((c, i) => `${i + 1}. "${c.title}" (due at ${c.commitment_time})`).join('\n')}

Provide recommendations with reasoning. Consider:
- High energy/happy: Complex or challenging tasks
- Low energy/tired: Simple, routine tasks
- Stressed: Quick wins or calming activities
- Match task complexity to energy levels`;

    console.log('Getting mood-based recommendations');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a helpful AI that recommends tasks based on mood and energy. Respond with JSON only.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'recommend_tasks',
            description: 'Recommend tasks based on mood',
            parameters: {
              type: 'object',
              properties: {
                recommended_order: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Task titles in recommended order'
                },
                reasoning: { type: 'string', maxLength: 200 }
              },
              required: ['recommended_order', 'reasoning'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'recommend_tasks' } }
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

    const recommendations = JSON.parse(toolCall.function.arguments);

    // Store mood log
    await supabase.from('user_moods').insert({
      user_id: user.id,
      mood,
      energy_level: energyLevel
    });

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in suggest-by-mood:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
