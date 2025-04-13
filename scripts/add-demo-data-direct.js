// For direct execution in the browser console to add demo data

// Function to add demo data directly
function addDemoDataDirect() {
  const timestamp = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  // Open the database
  const request = window.indexedDB.open("achievo-db", 1);
  
  request.onerror = function(event) {
    console.error("Database error:", event.target.error);
  };
  
  request.onsuccess = function(event) {
    const db = event.target.result;
    
    // Create a goal
    const goal = {
      id: `emergency-goal-${timestamp}`,
      title: "Emergency Demo Goal",
      createdAt: timestamp - 2 * dayInMs,
      taskIds: [],
      order: 200, 
      streakCounter: 2,
      lastCompletedDate: new Date().toISOString().split("T")[0],
      color: "#ff5722", 
      level: 1,
      xp: 100,
      lastActiveDate: timestamp - 1 * dayInMs
    };
    
    // Create a task
    const today = new Date().toISOString().split("T")[0];
    const task = {
      id: `emergency-task-${timestamp}`,
      title: "Emergency Demo Task",
      dueDate: today,
      suggestedDueDate: today,
      createdAt: timestamp - 1 * dayInMs,
      goalId: `emergency-goal-${timestamp}`,
      tags: ["emergency", "demo"],
      completed: false,
      priority: "high",
      isArchived: false,
      repeatPattern: null,
      completionTimestamp: null,
      xp: 50
    };
    
    // Add goal
    const goalTransaction = db.transaction(["goals"], "readwrite");
    const goalStore = goalTransaction.objectStore("goals");
    const goalRequest = goalStore.add(goal);
    
    goalRequest.onsuccess = function() {
      console.log("Goal added successfully");
      
      // Add task
      const taskTransaction = db.transaction(["tasks"], "readwrite");
      const taskStore = taskTransaction.objectStore("tasks");
      const taskRequest = taskStore.add(task);
      
      taskRequest.onsuccess = function() {
        console.log("Task added successfully");
        // Update goal's taskIds
        goal.taskIds.push(task.id);
        const updateGoalTransaction = db.transaction(["goals"], "readwrite");
        const updateGoalStore = updateGoalTransaction.objectStore("goals");
        const updateGoalRequest = updateGoalStore.put(goal);
        
        updateGoalRequest.onsuccess = function() {
          console.log("Goal updated with taskId");
          alert("Demo data added successfully! Please refresh the page.");
        };
      };
    };
  };
}

// Instructions for use:
// 1. Copy this entire script
// 2. Open your Achievo application in the browser
// 3. Open the browser's developer console (F12 or right-click > Inspect > Console)
// 4. Paste and run this code in the console
// 5. Refresh the page to see the demo data

// Uncomment this line to run automatically
// addDemoDataDirect(); 