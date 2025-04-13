// Script to add demo data programmatically
import { addInactivityDemoData, addPrebuiltData } from '../src/lib/prebuiltData.ts';

async function addAllDemoData() {
  console.log('Starting to add demo data...');
  
  try {
    console.log('Adding prebuilt data...');
    await addPrebuiltData();
    
    console.log('Adding inactivity demo data...');
    await addInactivityDemoData();
    
    console.log('Successfully added all demo data!');
  } catch (error) {
    console.error('Error adding demo data:', error);
  }
}

addAllDemoData(); 