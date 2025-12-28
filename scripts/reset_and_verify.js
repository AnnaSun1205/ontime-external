import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Load .env.local or .env if it exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envLocalPath = join(__dirname, '..', '.env.local');
const envPath = join(__dirname, '..', '.env');

let envFilePath = null;
if (existsSync(envLocalPath)) {
  envFilePath = envLocalPath;
} else if (existsSync(envPath)) {
  envFilePath = envPath;
}

if (envFilePath) {
  const envContent = readFileSync(envFilePath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  });
}

// Validate required environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  try {
    console.log('🔄 Starting data reset and verification...\n');

    // Step 1: Truncate opening_signals
    console.log('🗑️  Step 1: Truncating opening_signals table...');
    const { error: truncateError } = await supabase.rpc('exec_sql', {
      sql: 'TRUNCATE TABLE opening_signals;'
    }).catch(async () => {
      // Fallback: Use direct SQL if RPC doesn't exist
      const { error } = await supabase
        .from('opening_signals')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      return { error };
    });

    if (truncateError) {
      // Try alternative method
      console.log('   Trying alternative truncate method...');
      const { data: allRows } = await supabase
        .from('opening_signals')
        .select('id')
        .limit(10000);
      
      if (allRows && allRows.length > 0) {
        const ids = allRows.map(r => r.id);
        const batchSize = 100;
        for (let i = 0; i < ids.length; i += batchSize) {
          const batch = ids.slice(i, i + batchSize);
          await supabase
            .from('opening_signals')
            .delete()
            .in('id', batch);
        }
        console.log(`   ✅ Deleted ${ids.length} rows`);
      } else {
        console.log('   ✅ Table is already empty');
      }
    } else {
      console.log('   ✅ Table truncated successfully');
    }

    // Step 2: Call Edge Function to repopulate
    console.log('\n🚀 Step 2: Calling refresh_opening_signals Edge Function...');
    const functionUrl = `${SUPABASE_URL}/functions/v1/refresh_opening_signals`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const result = await response.json();
    
    if (!response.ok || !result.ok) {
      throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('   ✅ Edge Function executed successfully');
    console.log(`   📊 Inserted/Updated: ${result.total || 0}`);
    console.log(`   🧹 Deactivated: ${result.deactivated || 0}`);

    // Step 3: Verify no bad rows
    console.log('\n🔍 Step 3: Verifying data quality...');
    
    const { data: badRows, error: verifyError } = await supabase
      .from('opening_signals')
      .select('id, company_name')
      .or('company_name.eq.↳,company_name.is.null,company_name.eq.')
      .limit(100);

    if (verifyError) {
      throw verifyError;
    }

    if (badRows && badRows.length > 0) {
      console.error(`   ❌ Found ${badRows.length} rows with bad company names:`);
      badRows.slice(0, 5).forEach(row => {
        console.error(`      - ID: ${row.id}, Company: "${row.company_name}"`);
      });
      process.exit(1);
    } else {
      console.log('   ✅ No bad company names found');
    }

    // Step 4: Check total count
    const { count, error: countError } = await supabase
      .from('opening_signals')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    console.log(`   📊 Total rows in opening_signals: ${count || 0}`);

    // Step 5: Check company grouping
    const { data: companyGroups, error: groupError } = await supabase
      .from('opening_signals')
      .select('company_name')
      .eq('is_active', true);

    if (groupError) {
      throw groupError;
    }

    if (companyGroups) {
      const companyCounts = {};
      companyGroups.forEach(row => {
        companyCounts[row.company_name] = (companyCounts[row.company_name] || 0) + 1;
      });

      const multiRoleCompanies = Object.entries(companyCounts)
        .filter(([_, count]) => count > 1)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 5);

      if (multiRoleCompanies.length > 0) {
        console.log('\n   ✅ Companies with multiple roles (expected):');
        multiRoleCompanies.forEach(([company, count]) => {
          console.log(`      - ${company}: ${count} roles`);
        });
      }
    }

    console.log('\n🎉 Data reset and verification completed successfully!');
    console.log('\n✅ Summary:');
    console.log('   - Table truncated');
    console.log('   - Edge Function re-ran successfully');
    console.log('   - No bad company names found');
    console.log('   - Data is clean and ready to use');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.details) {
      console.error('   Details:', error.details);
    }
    if (error.hint) {
      console.error('   Hint:', error.hint);
    }
    process.exit(1);
  }
}

main();

