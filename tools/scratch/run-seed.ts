import { Amplify } from 'aws-amplify';
import { signIn } from 'aws-amplify/auth';
import outputs from '../amplify_outputs.json' assert { type: 'json' };
import { clearDemoData, seedDemoData } from '../src/lib/utils/seedDemoData';

Amplify.configure(outputs as any);

async function run() {
  console.log('Logging in as demo user...');
  try {
    await signIn({
      username: 'demo@weddingsteward.com',
      password: 'DemoPassword123!',
    });
    console.log('Logged in successfully!');
  } catch (error) {
    console.error('Failed to log in:', error);
    return;
  }

  try {
    await clearDemoData();
    await seedDemoData();
  } catch (error) {
    console.error('Error during seeding:', error);
  }
}

run();
