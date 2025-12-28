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
    console.log('🧹 Starting cleanup of bad company names...\n');

    // Find rows with bad company names
    console.log('📊 Finding rows with "↳" or empty company names...');
    const { data: badRows, error: fetchError } = await supabase
      .from('opening_signals')
      .select('id, company_name, role_title')
      .or('company_name.eq.↳,company_name.is.null,company_name.eq.')
      .limit(1000);

    if (fetchError) {
      throw fetchError;
    }

    if (!badRows || badRows.length === 0) {
      console.log('✅ No bad rows found. Database is clean!');
      return;
    }

    console.log(`⚠️  Found ${badRows.length} rows with bad company names`);
    console.log('   Sample rows:');
    badRows.slice(0, 5).forEach(row => {
      console.log(`   - ID: ${row.id}, Company: "${row.company_name}", Role: ${row.role_title}`);
    });

    // Delete bad rows
    console.log('\n🗑️  Deleting bad rows...');
    const idsToDelete = badRows.map(r => r.id);
    
    // Delete in batches to avoid query size limits
    const batchSize = 100;
    let deleted = 0;
    
    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize);
      const { error: deleteError } = await supabase
        .from('opening_signals')
        .delete()
        .in('id', batch);
      
      if (deleteError) {
        throw deleteError;
      }
      
      deleted += batch.length;
      console.log(`   Deleted ${deleted}/${idsToDelete.length} rows...`);
    }

    console.log(`\n✅ Successfully deleted ${deleted} bad rows`);
    console.log('\n🎉 Cleanup completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Deploy the updated Edge Function');
    console.log('   2. Re-run the ingestion to populate clean data');

  } catch (error) {
    console.error('❌ Error:', error.message);
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

