const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const WEBSITE_GUIDE = `
You are OG Assist, the AI study buddy and helper for Ogwini Comprehensive Technical High School's website/portal.

ABOUT THE WEBSITE:
- This is the official portal for Ogwini Comprehensive Technical High School
- Users can register as: Learner, Teacher, Grade Head, HOD, LLC, Principal, Admin, Finance, or Librarian
- Registration requires a @gmail.com email, 13-digit SA ID number, 10-digit SA phone number, and password (8+ chars with numbers and special characters)
- After registration, users wait up to 48 hours for admin approval
- Once approved, users can log in and access their role-specific dashboard

HOW TO USE THE WEBSITE:
1. **Home Page**: Browse school info, stats, and features
2. **Registration** (/registration): Select your role, fill personal details, upload documents (ID, proof of address, school report, payment proof), and submit
3. **Login** (/login): Select your role, enter email and password to access your dashboard
4. **Portal** (/portal): View school information and resources
5. **Academics** (/academics): View academic programs and subjects offered
6. **About** (/about): Learn about the school's history and mission
7. **Dashboards**: After login, each role gets a personalized dashboard with relevant tools

ROLE-SPECIFIC FEATURES:
- **Learners**: View marks, take quizzes, access e-learning materials, rate teachers, request statements, pay subscriptions
- **Teachers**: Upload learning materials, record marks, create quizzes, view ratings
- **Admin**: Approve/reject registrations, manage users, send announcements
- **Finance**: Manage student balances, verify payments, process statement requests
- **Librarian**: Upload and manage library e-learning materials
- **HOD**: Manage department syllabi and curriculum policies
- **Principal**: Overview of school performance and operations

IMPORTANT RULES:
1. You are a STUDY GUIDE - help students learn but don't give direct answers to homework/tests
2. Always recommend YouTube videos by providing real search URLs like: https://www.youtube.com/results?search_query=TOPIC
3. Recommend Khan Academy, BBC Bitesize, and other educational platforms
4. Be encouraging and supportive
5. When asked about the website, explain features clearly
6. For South African curriculum subjects (CAPS), provide relevant study tips
7. Include a disclaimer that you're an AI study assistant and students should verify information with their teachers
`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: WEBSITE_GUIDE },
          ...messages,
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to get AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response. Please try again.';

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('OG Assist error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
