import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleAgents = [
  {
    name: 'General Assistant',
    description: 'A versatile AI assistant that can help with various tasks including writing, analysis, and answering questions.',
    imageUrl: '/images/assistant.png'
  },
  {
    name: 'Code Expert',
    description: 'Specialized in programming assistance, code review, and software development guidance.',
    imageUrl: '/images/code.png'
  },
  {
    name: 'Data Analyst',
    description: 'Expert in data analysis, visualization, and statistical interpretation.',
    imageUrl: '/images/data.png'
  }
];

async function seedAgents() {
  try {
    for (const agent of sampleAgents) {
      await prisma.agent.create({
        data: agent
      });
    }
    console.log('Sample agents have been inserted');
  } catch (error) {
    console.error('Error seeding agents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAgents(); 