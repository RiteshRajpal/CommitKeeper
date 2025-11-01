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
    const { commitmentId, mood, energyLevel, userId, mode, commitments } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get recent mood logs for context
    const { data: moodLogs } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(5);

    // Handle bulk mode - analyze all commitments
    if (mode === 'bulk' && commitments) {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are a productivity assistant. Analyze commitments and provide scheduling recommendations. Always respond with valid JSON only, no markdown formatting or code blocks.'
            },
            {
              role: 'user',
              content: `Current mood: ${mood}, Energy level: ${energyLevel}.
              Recent mood patterns: ${JSON.stringify(moodLogs?.map(m => ({ mood: m.mood, energy: m.energy_level })))}.
              
              Commitments to analyze: ${JSON.stringify(commitments)}
              
              Analyze each commitment and determine:
              1. If it should be rescheduled based on current mood/energy
              2. Best time considering task type, priority, and user's energy patterns
              3. Provide actionable reasoning
              
              Rules:
              - High energy: Schedule demanding tasks (work, exercise, learning)
              - Low energy: Schedule light tasks (admin, planning, rest)
              - Stressed: Avoid social events, prioritize stress-relief activities
              - Happy: Good time for creative or social tasks
              - Consider task priority and deadlines
              
              Respond with ONLY this JSON array format (no markdown, no code blocks):
              [{"commitmentId": "id", "commitmentTitle": "title", "currentSchedule": "YYYY-MM-DD HH:MM", "shouldReschedule": true/false, "suggestedDate": "YYYY-MM-DD" or null, "suggestedTime": "HH:MM" or null, "reason": "specific explanation matching their mood and energy"}]`
            }
          ],
        }),
      });

      const aiData = await aiResponse.json();
      let recommendations = aiData.choices[0].message.content;
      
      console.log('AI Bulk Recommendations:', recommendations);

      // Extract JSON from markdown code blocks if present
      if (typeof recommendations === 'string') {
        const jsonMatch = recommendations.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          recommendations = jsonMatch[1];
        }
        try {
          recommendations = JSON.parse(recommendations);
        } catch (e) {
          console.error('Failed to parse AI recommendations:', e);
          throw new Error('Invalid AI response format');
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          recommendations: recommendations
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Handle single commitment mode
    const { data: commitment } = await supabase
      .from('commitments')
      .select('*')
      .eq('id', commitmentId)
      .single();

    if (!commitment) {
      throw new Error('Commitment not found');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a productivity assistant that helps reschedule commitments based on user mood and energy levels. Provide concise, actionable suggestions.'
          },
          {
            role: 'user',
            content: `Current mood: ${mood}, Energy level: ${energyLevel}. 
            Commitment: "${commitment.title}" scheduled for ${commitment.due_date} at ${commitment.due_time}.
            Recent mood patterns: ${JSON.stringify(moodLogs?.map(m => ({ mood: m.mood, energy: m.energy_level })))}.
            
            Should this task be rescheduled? If yes, suggest the best time based on the user's energy patterns. Respond with JSON: {"shouldReschedule": boolean, "suggestion": "your suggestion", "recommendedTime": "HH:MM" or null}`
          }
        ],
      }),
    });

    const aiData = await aiResponse.json();
    const aiSuggestion = aiData.choices[0].message.content;
    
    console.log('AI Suggestion:', aiSuggestion);

    return new Response(
      JSON.stringify({ 
        success: true,
        suggestion: aiSuggestion,
        commitment 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in ai-reschedule:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
