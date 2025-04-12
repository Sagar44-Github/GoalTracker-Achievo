
// In the useEffect for initializing the app, modify the initApp function
const initApp = async () => {
  setIsLoading(true);
  try {
    // Create default goals if none exist
    await createDefaultGoals();
    
    // Add initial data
    await db.createDefaultData();
    
    // Load goals and tasks
    await refreshData();
  } catch (error) {
    console.error('Failed to initialize app:', error);
  } finally {
    setIsLoading(false);
  }
};
