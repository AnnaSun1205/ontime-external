import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge Function to delete a user account and all associated data
 * 
 * Security:
 * - Verifies JWT token from Authorization header
 * - Only allows users to delete their own account
 * - Uses service role key for admin operations (deleting from Auth)
 * 
 * Data cleanup order (respects foreign key constraints):
 * 1. events (depends on boards)
 * 2. board_companies (depends on boards)
 * 3. boards (no dependencies after above)
 * 4. user_preferences, profiles, user_settings (independent)
 * 5. Finally, delete user from Supabase Auth
 */
serve(async (req) => {
  console.log('delete_account invoked');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Step 1: Extract Bearer token from Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('hasAuth?', !!authHeader);
    
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract Bearer token
    const token = authHeader.replace('Bearer ', '').trim();
    const looksJwt = token?.split('.').length === 3;
    console.log('looksJwt?', looksJwt, 'tokenLength', token?.length);
    
    if (!token) {
      console.error('Invalid authorization header format - empty token');
      return new Response(
        JSON.stringify({ error: 'Invalid authorization header format' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!looksJwt) {
      console.error('Token does not look like a JWT (should have 3 parts separated by dots)');
      return new Response(
        JSON.stringify({ error: 'Invalid token format - not a JWT' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client with anon key for JWT verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Decode JWT to verify it has a 'sub' claim (user ID)
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('JWT payload has sub?', !!payload.sub, 'sub value:', payload.sub);
        if (!payload.sub) {
          console.error('JWT missing sub claim - this is not a user access token');
          return new Response(
            JSON.stringify({ error: 'Invalid token: missing user ID (sub claim). Ensure you are using a user access token, not anon/service role key.' }),
            { 
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }
    } catch (decodeError) {
      console.error('Failed to decode JWT:', decodeError);
      // Continue anyway - let getUser() handle validation
    }

    // Create client with anon key to verify JWT
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Verify JWT and get user by passing the token explicitly
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError) {
      console.error('Auth error:', authError.message);
      return new Response(
        JSON.stringify({ error: `Invalid or expired token: ${authError.message}` }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!user) {
      console.error('User not found in token');
      return new Response(
        JSON.stringify({ error: 'User not found in token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const userId = user.id;
    console.log(`Starting account deletion for user: ${userId}`);

    // Step 2: Create service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Step 3: Delete user data in correct order (respecting foreign key constraints)
    
    // 3.1: Delete events (depends on boards via board_id)
    console.log(`Deleting events for user ${userId}...`);
    const { error: eventsError } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('user_id', userId);
    
    if (eventsError) {
      console.error('Error deleting events:', eventsError);
      throw new Error(`Failed to delete events: ${eventsError.message}`);
    }
    console.log('✓ Events deleted');

    // 3.2: Delete board_companies (depends on boards via board_id)
    console.log(`Deleting board_companies for user ${userId}...`);
    const { error: boardCompaniesError } = await supabaseAdmin
      .from('board_companies')
      .delete()
      .eq('user_id', userId);
    
    if (boardCompaniesError) {
      console.error('Error deleting board_companies:', boardCompaniesError);
      throw new Error(`Failed to delete board_companies: ${boardCompaniesError.message}`);
    }
    console.log('✓ Board companies deleted');

    // 3.3: Delete boards (no dependencies after events and board_companies are deleted)
    console.log(`Deleting boards for user ${userId}...`);
    const { error: boardsError } = await supabaseAdmin
      .from('boards')
      .delete()
      .eq('user_id', userId);
    
    if (boardsError) {
      console.error('Error deleting boards:', boardsError);
      throw new Error(`Failed to delete boards: ${boardsError.message}`);
    }
    console.log('✓ Boards deleted');

    // 3.4: Delete user_preferences (independent)
    console.log(`Deleting user_preferences for user ${userId}...`);
    const { error: preferencesError } = await supabaseAdmin
      .from('user_preferences')
      .delete()
      .eq('user_id', userId);
    
    if (preferencesError) {
      console.error('Error deleting user_preferences:', preferencesError);
      throw new Error(`Failed to delete user_preferences: ${preferencesError.message}`);
    }
    console.log('✓ User preferences deleted');

    // 3.5: Delete profiles (independent)
    console.log(`Deleting profiles for user ${userId}...`);
    const { error: profilesError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId);
    
    if (profilesError) {
      console.error('Error deleting profiles:', profilesError);
      throw new Error(`Failed to delete profiles: ${profilesError.message}`);
    }
    console.log('✓ Profiles deleted');

    // 3.6: Delete user_settings (independent)
    console.log(`Deleting user_settings for user ${userId}...`);
    const { error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .delete()
      .eq('user_id', userId);
    
    if (settingsError) {
      console.error('Error deleting user_settings:', settingsError);
      throw new Error(`Failed to delete user_settings: ${settingsError.message}`);
    }
    console.log('✓ User settings deleted');

    // Step 4: Delete user from Supabase Auth (requires service role key)
    console.log(`Deleting user from Auth for user ${userId}...`);
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authDeleteError) {
      console.error('Error deleting user from Auth:', authDeleteError);
      throw new Error(`Failed to delete user from Auth: ${authDeleteError.message}`);
    }
    console.log('✓ User deleted from Auth');

    console.log(`Account deletion completed successfully for user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Account deleted successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Account deletion error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to delete account',
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

