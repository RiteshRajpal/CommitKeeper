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
    const { commitmentId, title, commitmentDate, commitmentTime } = await req.json();
    
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

    // Get user's commitment history for context
    const { data: history } = await supabase
      .from('commitments')
      .select('title, completed, commitment_date')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const completionRate = history 
      ? (history.filter(c => c.completed).length / history.length * 100).toFixed(0)
      : 0;

    const prompt = `Analyze this commitment and assign a priority score and urgency level.

Commitment Details:
- Title: "${title}"
- Due Date: ${commitmentDate}
- Due Time: ${commitmentTime}

User Context:
- Recent completion rate: ${completionRate}%
- Recent commitments: ${history?.slice(0, 5).map(h => h.title).join(', ') || 'None'}

Provide:
1. Priority score (0.0-1.0, where 1.0 is highest priority)
2. Urgency level (low/medium/high/critical)
3. Brief reasoning (max 50 words)

Consider: deadline proximity, task complexity indicated by title, user's completion patterns.`;

    console.log('Calling AI for priority analysis:', { commitmentId, title });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an AI assistant that analyzes task priority. Respond with JSON only.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'set_priority',
            description: 'Set priority information for a commitment',
            parameters: {
              type: 'object',
              properties: {
                priority_score: { type: 'number', minimum: 0, maximum: 1 },
                urgency_level: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                reasoning: { type: 'string', maxLength: 150 }
              },
              required: ['priority_score', 'urgency_level', 'reasoning'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'set_priority' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('AI response:', JSON.stringify(result));

    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No tool call in AI response');

    const priorityData = JSON.parse(toolCall.function.arguments);

    // Store priority in database
    const { error: insertError } = await supabase
      .from('task_priorities')
      .insert({
        commitment_id: commitmentId,
        user_id: user.id,
        priority_score: priorityData.priority_score,
        urgency_level: priorityData.urgency_level,
        reasoning: priorityData.reasoning
      });

    if (insertError) throw insertError;

    return new Response(JSON.stringify(priorityData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in analyze-priority:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
