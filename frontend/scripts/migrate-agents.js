const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function migrateAgents() {
  try {
    // Get all agents from local database
    const agents = await prisma.agent.findMany();
    console.log(`Found ${agents.length} agents in local database`);

    // Transform the data to match Supabase schema
    const transformedAgents = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      image_url: agent.imageUrl,
      code: agent.code || '',
      created_at: agent.createdAt,
      updated_at: agent.updatedAt
    }));

    // Insert agents into Supabase
    const { data, error } = await supabase
      .from('agents')
      .upsert(transformedAgents)
      .select();

    if (error) {
      console.error('Error inserting agents into Supabase:', error);
      return;
    }

    console.log(`Successfully migrated ${data.length} agents to Supabase`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateAgents(); 