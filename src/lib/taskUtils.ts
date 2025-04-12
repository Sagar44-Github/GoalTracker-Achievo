
import { Task, db } from './db';

// Generate a unique ID
export const generateId = (): string => {
  return crypto.randomUUID();
};

// Suggest tags based on task title using keyword matching
export const suggestTags = (title: string): string[] => {
  const title_lower = title.toLowerCase();
  const suggestions: string[] = [];
  
  // Work-related keywords
  if (/\b(email|meeting|call|presentation|report|deadline|client|project|workflow|work)\b/.test(title_lower)) {
    suggestions.push('work');
  }
  
  // Study-related keywords
  if (/\b(study|exam|test|quiz|homework|assignment|class|course|lecture|read|book|notes|research|essay|paper|thesis)\b/.test(title_lower)) {
    suggestions.push('study');
  }
  
  // Personal-related keywords
  if (/\b(grocery|shopping|clean|laundry|cook|meal|exercise|gym|doctor|appointment|family|friend|call|visit|party|event)\b/.test(title_lower)) {
    suggestions.push('personal');
  }
  
  // Health-related keywords
  if (/\b(gym|workout|exercise|run|jog|swim|health|doctor|dentist|medicine|pill|vitamin|diet|nutrition|sleep|rest|meditate|yoga)\b/.test(title_lower)) {
    suggestions.push('health');
  }
  
  // Finance-related keywords
  if (/\b(pay|bill|budget|finance|money|bank|invest|tax|expense|income|salary|debt|loan|mortgage|rent|insurance)\b/.test(title_lower)) {
    suggestions.push('finance');
  }
  
  // Travel-related keywords
  if (/\b(travel|trip|flight|hotel|vacation|booking|reservation|passport|visa|pack|luggage|map|itinerary|tour|guide)\b/.test(title_lower)) {
    suggestions.push('travel');
  }
  
  // Extract hashtags from title
  const hashtagRegex = /#(\w+)/g;
  let match;
  while ((match = hashtagRegex.exec(title)) !== null) {
    suggestions.push(match[1]);
  }
  
  // Return unique suggestions
  return [...new Set(suggestions)];
};

// Suggest due date based on task properties
export const suggestDueDate = (task: Partial<Task>): string => {
  const today = new Date();
  
  // For urgent/high priority tasks
  if (task.priority === 'high') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  // For low priority tasks
  if (task.priority === 'low') {
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    return threeDaysLater.toISOString().split('T')[0];
  }
  
  // For personal tasks
  if (task.tags?.includes('personal')) {
    const twoDaysLater = new Date(today);
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);
    return twoDaysLater.toISOString().split('T')[0];
  }
  
  // Default: 2 days from now
  const twoDaysLater = new Date(today);
  twoDaysLater.setDate(twoDaysLater.getDate() + 2);
  return twoDaysLater.toISOString().split('T')[0];
};

// Parse natural language date expressions
export const parseDateExpression = (expression: string): string | null => {
  const today = new Date();
  const expressionLower = expression.toLowerCase();
  
  // Handle "today"
  if (expressionLower === 'today') {
    return today.toISOString().split('T')[0];
  }
  
  // Handle "tomorrow"
  if (expressionLower === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  // Handle "next week"
  if (expressionLower === 'next week') {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }
  
  // Handle day names (e.g., "Friday")
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = dayNames.findIndex(day => expressionLower === day);
  
  if (dayIndex !== -1) {
    const targetDate = new Date(today);
    const currentDay = today.getDay();
    const daysUntilTarget = (dayIndex - currentDay + 7) % 7;
    
    // If today is the target day, move to next week
    targetDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
    return targetDate.toISOString().split('T')[0];
  }
  
  // Handle "+X days/weeks/months"
  const plusRegex = /\+(\d+)\s*(day|days|week|weeks|month|months)/i;
  const plusMatch = expressionLower.match(plusRegex);
  
  if (plusMatch) {
    const amount = parseInt(plusMatch[1]);
    const unit = plusMatch[2].toLowerCase();
    const targetDate = new Date(today);
    
    if (unit.startsWith('day')) {
      targetDate.setDate(today.getDate() + amount);
    } else if (unit.startsWith('week')) {
      targetDate.setDate(today.getDate() + (amount * 7));
    } else if (unit.startsWith('month')) {
      targetDate.setMonth(today.getMonth() + amount);
    }
    
    return targetDate.toISOString().split('T')[0];
  }
  
  // Try to parse as a date string (e.g., "2023-04-15")
  try {
    const date = new Date(expression);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Failed to parse as a date string
  }
  
  return null;
};

// Format a date for display
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'No due date';
  
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Format based on how far in the future the date is
  if (dateString === today.toISOString().split('T')[0]) {
    return 'Today';
  } else if (dateString === tomorrow.toISOString().split('T')[0]) {
    return 'Tomorrow';
  } else {
    // For other dates, format as "Mon, Apr 15"
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
};

// Parse command for task management
export const parseCommand = (command: string): { 
  action: string;
  title?: string;
  dueDate?: string;
  goalId?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
} | null => {
  const commandLower = command.toLowerCase().trim();
  
  // Extract action
  const addRegex = /^add:?\s+(.+)$/i;
  const completeRegex = /^(complete|done|finish):?\s+(.+)$/i;
  const deleteRegex = /^(delete|remove):?\s+(.+)$/i;
  const showRegex = /^(show|display|list):?\s+(.+)$/i;
  const moveRegex = /^move:?\s+(.+?)\s+to\s+(.+)$/i;
  
  // Extract information based on action
  if (addRegex.test(command)) {
    const match = command.match(addRegex);
    if (!match) return null;
    
    const content = match[1];
    let title = content;
    let dueDate: string | undefined;
    let goalId: string | undefined;
    let tags: string[] = [];
    let priority: 'low' | 'medium' | 'high' = 'medium';
    
    // Extract due date
    const dueDateRegex = /(.*?)(by|on|due)\s+(.+?)(?:\s+|$)/i;
    const dueDateMatch = content.match(dueDateRegex);
    
    if (dueDateMatch) {
      title = (dueDateMatch[1] + ' ' + (dueDateMatch[4] || '')).trim();
      const dateExpression = dueDateMatch[3];
      const parsedDate = parseDateExpression(dateExpression);
      
      if (parsedDate) {
        dueDate = parsedDate;
      }
    }
    
    // Extract goal assignment
    const goalRegex = /(.*?)(under|for goal|for|goal)\s+(.+?)(?:\s+|$)/i;
    const goalMatch = title.match(goalRegex);
    
    if (goalMatch) {
      title = (goalMatch[1] + ' ' + (goalMatch[4] || '')).trim();
      goalId = goalMatch[3]; // This is the goal name, we'll need to resolve it to an ID
    }
    
    // Extract tags
    const tagRegex = /#(\w+)/g;
    let tagMatch;
    
    while ((tagMatch = tagRegex.exec(title)) !== null) {
      tags.push(tagMatch[1]);
    }
    
    // Remove tags from title
    title = title.replace(/#\w+/g, '').trim();
    
    // Extract priority
    const priorityRegex = /(!{1,3})/;
    const priorityMatch = title.match(priorityRegex);
    
    if (priorityMatch) {
      const exclamationCount = priorityMatch[1].length;
      
      if (exclamationCount === 1) {
        priority = 'low';
      } else if (exclamationCount === 2) {
        priority = 'medium';
      } else if (exclamationCount >= 3) {
        priority = 'high';
      }
      
      // Remove priority markers from title
      title = title.replace(/!+/g, '').trim();
    }
    
    return {
      action: 'add',
      title,
      dueDate,
      goalId,
      tags,
      priority
    };
  } else if (completeRegex.test(command)) {
    const match = command.match(completeRegex);
    if (!match) return null;
    
    return {
      action: 'complete',
      title: match[2].trim()
    };
  } else if (deleteRegex.test(command)) {
    const match = command.match(deleteRegex);
    if (!match) return null;
    
    return {
      action: 'delete',
      title: match[2].trim()
    };
  } else if (showRegex.test(command)) {
    const match = command.match(showRegex);
    if (!match) return null;
    
    const content = match[2].trim();
    
    // Check if showing tasks for a specific goal
    const goalRegex = /(tasks\s+)?(under|for goal|for|goal)\s+(.+?)(?:\s+|$)/i;
    const goalMatch = content.match(goalRegex);
    
    if (goalMatch) {
      return {
        action: 'show',
        goalId: goalMatch[3].trim()
      };
    }
    
    // Check if showing tasks for a specific date
    const dateRegex = /(today's|tomorrow's|this week's|next week's|overdue)\s+tasks/i;
    const dateMatch = content.match(dateRegex);
    
    if (dateMatch) {
      return {
        action: 'show',
        dueDate: dateMatch[1].toLowerCase().replace(/'s tasks$/, '')
      };
    }
    
    return {
      action: 'show',
      title: content
    };
  } else if (moveRegex.test(command)) {
    const match = command.match(moveRegex);
    if (!match) return null;
    
    return {
      action: 'move',
      title: match[1].trim(),
      goalId: match[2].trim()
    };
  }
  
  return null;
};

// Parse speech input for task creation
export const parseSpeechInput = (text: string): { 
  title: string;
  dueDate?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
} | null => {
  // Extract task title and due date
  const regex = /(.*?)(by|on|due)\s+(.+?)(?:\s+|$)/i;
  const match = text.match(regex);
  
  if (match) {
    const title = match[1].trim();
    const dateExpression = match[3];
    const parsedDate = parseDateExpression(dateExpression);
    
    // Extract tags
    const tags = suggestTags(title);
    
    // Determine priority based on urgency words
    let priority: 'low' | 'medium' | 'high' = 'medium';
    
    if (/\b(urgent|asap|immediately|critical|high priority)\b/i.test(title)) {
      priority = 'high';
    } else if (/\b(whenever|sometime|low priority|not urgent)\b/i.test(title)) {
      priority = 'low';
    }
    
    return {
      title,
      dueDate: parsedDate || undefined,
      tags,
      priority
    };
  }
  
  // If no due date is specified, just return the title
  return {
    title: text.trim(),
    tags: suggestTags(text)
  };
};
