import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import "../styles/chat-assistant.css";

// Define the message type
type Message = {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
};

// Response patterns organized by topic
const responsePatterns = {
  greeting: {
    patterns: [
      /\b(?:hi|hello|hey|greetings|howdy)\b/i,
      /\bwhat(?:'s| is) up\b/i,
      /\bgood (?:morning|afternoon|evening)\b/i,
    ],
    responses: [
      "Hello! How can I help with your productivity today?",
      "Hi there! Do you need help with goals, tasks, or focus mode?",
      "Hey! I'm here to help you stay productive. What would you like to know?",
    ],
  },
  goal: {
    patterns: [
      /\bhow (?:do|can) (?:I|you) (?:create|add|make) (?:a |new )?goals?\b/i,
      /\bhow (?:to|do I) (?:edit|update|change|modify) (?:a |my )?goals?\b/i,
      /\bhow (?:to|do I) (?:delete|remove) (?:a |my )?goals?\b/i,
      /\bwhat (?:is|are) goals?\b/i,
      /\bgoals? (?:help|info|information)\b/i,
    ],
    responses: [
      "To create a new goal, click the '+' button in the Goals section. You can set a title, color, and start adding tasks to it.",
      "To edit a goal, click on the goal title or the edit icon next to it. You can change its name, color, or associated tasks.",
      "Goals help you organize related tasks. Each goal can have multiple tasks and tracks your progress.",
      "You can archive goals you've completed by clicking the archive icon. This keeps your workspace clean while preserving your accomplishments.",
      "Try creating theme-based goals for different areas of your life like 'Health', 'Work', or 'Learning'.",
    ],
  },
  task: {
    patterns: [
      /\bhow (?:do|can) (?:I|you) (?:create|add|make) (?:a |new )?tasks?\b/i,
      /\bhow (?:to|do I) (?:edit|update|change|modify) (?:a |my )?tasks?\b/i,
      /\bhow (?:to|do I) (?:delete|remove) (?:a |my )?tasks?\b/i,
      /\bhow (?:to|do I) (?:complete|finish|mark done) (?:a |my )?tasks?\b/i,
      /\btasks? (?:help|info|information)\b/i,
    ],
    responses: [
      "To create a task, select a goal first, then click the 'Add Task' button. You can set a title, due date, and priority.",
      "To edit a task, click on the task or the edit icon. You can update its details, priority, or due date.",
      "To complete a task, click the checkbox next to it. Completed tasks contribute to your goal progress.",
      "To delete a task, hover over it and click the delete icon, or open the task and select 'Delete'.",
      "Tasks can be prioritized as Low, Medium, or High to help you focus on what's most important.",
    ],
  },
  focus: {
    patterns: [
      /\bfocus (?:mode|help)\b/i,
      /\bhow (?:do|can) (?:I|you) (?:use|enable|activate|start) focus mode\b/i,
      /\bwhat (?:is|does) focus mode\b/i,
    ],
    responses: [
      "Focus Mode helps you concentrate on one task at a time. Toggle it on from the main menu to minimize distractions.",
      "In Focus Mode, the app will show you only high-priority tasks, one at a time, helping you stay on track.",
      "Focus Mode is great for deep work sessions. It removes distractions and helps you complete important tasks first.",
      "To use Focus Mode effectively, make sure to set priorities for your tasks first.",
    ],
  },
  archive: {
    patterns: [
      /\bhow (?:do|can) (?:I|you) (?:archive|store) (?:a |my )?goals?\b/i,
      /\barchived (?:goals|tasks)\b/i,
      /\bwhere (?:are|can I find) (?:my )?archived (?:goals|tasks)\b/i,
    ],
    responses: [
      "To archive a goal, click the archive icon next to it. Archived goals are moved out of your active list but still accessible.",
      "You can find archived goals in the 'Archived' section in the sidebar. This helps keep your workspace clean.",
      "Archiving is useful for completed goals you want to reference later but don't need in your active view.",
      "Archiving goals doesn't delete them, it just moves them to a different section for better organization.",
    ],
  },
  priority: {
    patterns: [
      /\bhow (?:do|can) (?:I|you) (?:set|change) (?:the )?priority\b/i,
      /\bwhat (?:do|are) (?:the )?priorities? mean\b/i,
      /\bhigh|medium|low priority\b/i,
    ],
    responses: [
      "You can set a task's priority when creating or editing it. Choose from Low, Medium, or High based on importance.",
      "High priority tasks are shown first in Focus Mode and are highlighted to draw your attention.",
      "Use priorities to help you decide what to work on next. High priority for urgent and important tasks, Medium for important but not urgent, and Low for everything else.",
      "You can filter tasks by priority using the filter options in the task view.",
    ],
  },
  theme: {
    patterns: [
      /\btheme(?:s)? based task\b/i,
      /\bdaily theme\b/i,
      /\bhow (?:do|can) (?:I|you) (?:use|set|change) (?:the )?theme\b/i,
    ],
    responses: [
      "Theme-based tasks help you organize recurring activities. For example, 'Monday: Learning', 'Tuesday: Health', etc.",
      "You can set up daily themes in the Profile section, and tasks will be automatically tagged with these themes.",
      "Daily themes can help you batch similar tasks on specific days for better focus and productivity.",
      "Try setting up themes like 'Deep Work', 'Admin', 'Creative', or 'Wellness' to organize your week.",
    ],
  },
  help: {
    patterns: [
      /\bhelp\b/i,
      /\bwhat can you do\b/i,
      /\bwhat can I ask\b/i,
      /\bhow does this (?:work|app work)\b/i,
    ],
    responses: [
      "I can help you with information about goals, tasks, focus mode, and productivity tips. Just ask me a question!",
      "You can ask me how to create goals and tasks, use focus mode, set priorities, or manage your productivity.",
      "I'm here to answer questions about using the app. Try asking about specific features you'd like to learn more about.",
      "I can explain features like goals, tasks, focus mode, priorities, and themes. What would you like to know?",
    ],
  },
  notFound: {
    responses: [
      "Sorry, I didn't quite understand that. Can you rephrase?",
      "I'm still learning. Could you ask that in a different way?",
      "I can help with goals, tasks, and focus mode. What would you like to do?",
    ],
  },
};

export const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hello! I'm your assistant. How can I help you with your goals and tasks today?",
      sender: "assistant",
      timestamp: new Date(),
    },
    {
      id: "test",
      text: "Type something and press Enter to chat with me!",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submit triggered", input);

    const currentInput = input.trim();
    if (!currentInput) return;

    // Add user message using the captured input
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: currentInput,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput(""); // Clear the input field now

    // Generate response with slight delay
    setTimeout(() => {
      // Use the captured input value to generate the response
      const responseText = generateResponse(currentInput);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        text: responseText,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    }, 600);
  };

  const generateResponse = (userInput: string): string => {
    // First, check for test message to make it easy to confirm the chat works
    if (userInput.toLowerCase().includes("test")) {
      return "Yes, the chat is working now! You can ask me about goals, tasks, or using the app.";
    }

    // Check each topic's patterns
    for (const [topic, data] of Object.entries(responsePatterns)) {
      if (topic === "notFound") continue; // Skip the notFound category in the loop

      const topicData = data as { patterns?: RegExp[]; responses: string[] };
      if (!topicData.patterns) continue;

      // Check if any pattern matches
      for (const pattern of topicData.patterns) {
        if (pattern.test(userInput)) {
          // Return a random response from this topic
          const randomIndex = Math.floor(
            Math.random() * topicData.responses.length
          );
          return topicData.responses[randomIndex];
        }
      }
    }

    // If no patterns matched, return a notFound response
    // This relies on the 'notFound' key now being present in responsePatterns
    const notFoundResponses = responsePatterns.notFound.responses;
    const randomIndex = Math.floor(Math.random() * notFoundResponses.length);
    return notFoundResponses[randomIndex];
  };

  return (
    <div className={`chat-assistant ${isOpen ? "open" : ""}`}>
      <button
        className="chat-toggle"
        onClick={toggleChat}
        aria-label="Toggle chat assistant"
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </button>

      <div className="chat-window">
        <div className="chat-header">
          <span>Productivity Assistant</span>
          <X size={18} onClick={toggleChat} />
        </div>

        <div className="chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chat-message ${
                message.sender === "user" ? "user-message" : "assistant-message"
              }`}
            >
              {message.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-container" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about goals, tasks, focus mode..."
            aria-label="Chat message input"
          />
          <button
            type="submit"
            disabled={input.trim() === ""}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatAssistant;
