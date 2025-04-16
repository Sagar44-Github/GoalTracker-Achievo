# Goal Flow Achievo 🚀

**A comprehensive productivity and goal-tracking application designed to help users manage tasks, achieve goals, and collaborate effectively.**

![Goal Flow Achievo Screenshot](placeholder.png) _<!-- TODO: Add a relevant screenshot -->_

## Overview

Goal Flow Achievo is a feature-rich web application built with modern web technologies. It provides a sophisticated platform for users to define their goals, break them down into manageable tasks, track their progress over time, and stay motivated. Key features include detailed task management, focus modes, daily themes, timeline visualization, user profiles, and team collaboration.

## ✨ Key Features

**1. Goal Management:**

- **CRUD Operations:** Create, Read, Update, and Delete goals.
- **Ordering & Prioritization:** Arrange goals based on importance using drag-and-drop or defined order.
- **Archiving & Pausing:** Temporarily hide or pause goals without deleting them. Archived goals' tasks are prioritized in the "All Tasks" view.
- **Streaks & Progress Tracking:** Maintain daily completion streaks for goals. Goals automatically update `lastCompletedDate`.
- **Gamification:**
  - **Levels & XP:** Gain experience points (XP) for completing tasks associated with a goal, leveling up the goal over time.
  - **Badges:** Earn badges for achieving specific milestones or demonstrating consistent effort (e.g., "consistent-effort", "innovator").
- **Visual Customization:** Assign custom colors to goals for better visual organization.
- **Activity Tracking:** Goals track the `lastActiveDate` based on task completions or edits. Inactive goals are visually distinguished in the UI.

**2. Task Management:**

- **CRUD Operations:** Create, Read, Update, and Delete tasks.
- **Goal Association:** Link tasks to specific goals or leave them unassigned.
- **Due Dates:** Set specific due dates. The system can also suggest due dates based on context.
- **Priorities:** Assign priorities (low, medium, high) to tasks, influencing sorting and focus mode behavior.
- **Tags & Descriptions:** Add descriptive tags for filtering and context, along with detailed task descriptions.
- **Completion Tracking:** Mark tasks as complete. Completion timestamps are recorded.
- **Repeating Tasks:** Configure tasks to repeat daily, weekly, monthly, or with custom intervals. Completed repeating tasks automatically generate the next occurrence based on their pattern.
- **Dependencies:** Define task dependencies (e.g., Task B cannot be started until Task A is complete - _future feature hint_).
- **Quiet Tasks:** Designate tasks as "quiet" to handle them separately. Quiet tasks can be managed in the dedicated 'Quiet Zone' panel, keeping the main task list focused on active items.
- **Archiving:** Archive individual tasks.
- **Time Tracking:** Record time spent on tasks (manual or potentially automatic).
- **Theme Association:** Link tasks to specific Daily Themes.

**3. Task Views & Organization:**

- **Comprehensive Task List:** View all tasks, sorted intelligently (tasks from archived goals first, then by due date, priority, and creation date).
- **Goal-Specific Views:** Filter tasks based on the currently selected goal.
- **Filtering Options:** Various potential filters (by tag, priority, due date range, etc.).

**4. Focus Mode:**

- **Distraction-Free Environment:** A dedicated mode designed to help users concentrate on specific tasks.
- **Integrated Timer:** A built-in timer (potentially using the Pomodoro Technique) to structure work sessions.
- **Task Highlighting:** The current task being focused on is prominently highlighted.
- **Auto-Focus:** Automatically suggests and focuses on the highest-priority task due soonest.
- **Progressive Task Flow:** Seamlessly move from one focused task to the next.

**5. Daily Themes:**

- **Customizable Themes:** Define themes for each day of the week (e.g., "Mind & Body Monday", "Deep Work Thursday", "Weekend Recharge").
- **Theme Attributes:** Assign names, descriptions, colors, motivational quotes, and relevant tags to each theme.
- **Theme-Based Task Filtering:** View tasks associated with the current day's theme, promoting focused effort based on the daily intention. Tasks can be associated with a theme manually or potentially through matching tags.

**6. Timeline View:**

- **Daily Summary:** Provides a visual overview of activity for each day.
- **Productivity Score:** Calculates and displays a daily productivity score ("low", "medium", "high") (e.g., based on number and priority of completed tasks).
- **Task History:** Shows completed tasks for the selected day.
- **Goal Activity:** Highlights activity related to goals on that day.

**7. History Tracking:**

- **Comprehensive Logs:** Records significant actions (add, complete, edit, delete, archive) for tasks, goals, and team activities.
- **Audit Trail:** Provides a history of changes and completions for review.


**8. Team Collaboration:**

- **Team Creation & Management:** Users can create teams, which automatically generates a unique 6-character join code.
- **Joining Teams:** Users can join existing teams using the team code.
- **Roles:** Define roles within a team (Captain, Vice-Captain, Member). The team creator is initially the Captain.
- **Team Tasks:** Create tasks specific to a team, assign them to members, and set point values.
- **Point System:** Team members earn points for completing team tasks, contributing to potential team leaderboards or progress visualization.
- **Team Views:** View team members, assigned tasks, and overall team progress.
- **Sample Team Generation:** Option to generate a sample team ("Productivity Champions") with fictional members and tasks for demonstration.

**9. AI Chat Assistant:**

- **Integrated Assistance:** Includes an AI chat component for user support, task suggestions, or other interactions.

**10. Data Management:**

- **Local Storage:** Utilizes IndexedDB via the `idb` library for robust client-side data storage.
- **Default Data:** Automatically populates the database with initial sample goals, tasks, and daily themes upon first launch if the database is empty.
- **Realistic Sample Data:** Provides functions (`addRealisticGoals`, `addPrebuiltData`, `addInactivityDemoData`) to add more extensive and varied sample data for testing and demonstration.
- **Resetting Data:** For a complete reset during development, clear the IndexedDB database ('achievo-db') in your browser's developer tools.

**11. UI/UX:**

- **Modern Component Library:** Built with Shadcn UI, providing accessible and composable React components.
- **Utility-First CSS:** Styled using Tailwind CSS for rapid and consistent UI development.
- **Responsiveness:** Designed to work effectively across different screen sizes.
- **User Feedback:** Provides clear feedback through toast notifications for actions (success, error) and loading states (spinners, disabled buttons) during asynchronous operations.

## 💻 Technology Stack

- **Frontend Framework:** React (via Vite)
- **Language:** TypeScript
- **UI Components:** Shadcn UI
- **Styling:** Tailwind CSS
- **State Management:** React Context API
- **Client-Side Database:** IndexedDB (using `idb` library)
- **Routing:** React Router DOM
- **Date/Time:** `date-fns`
- **Icons:** Lucide React
- **Development Tooling:** Vite

## 🚀 Getting Started

Follow these steps to get the project running locally:

1.  **Clone the Repository:**

    ```bash
    git clone <repository-url>
    cd goal-flow-achievo
    ```

2.  **Install Dependencies:**
    Requires Node.js (e.g., v18+ recommended) and npm (or yarn/pnpm).

    ```bash
    npm install
    ```

    _Or `yarn install` or `pnpm install`_

3.  **Run the Development Server:**

    ```bash
    npm run dev
    ```

    _Or `yarn dev` or `pnpm dev`_

4.  **Open the Application:**
    Navigate to `http://localhost:5173` (or the port specified in your terminal) in your web browser. The application uses IndexedDB, so all data will be stored locally in your browser.

## 🛠️ Usage

- **Initial Data:** On first load with an empty database, sample goals, tasks, and themes will be automatically created.
- **Adding Goals/Tasks:** Use the designated "+" buttons or forms within the UI.
- **Managing Items:** Click on goals or tasks to view details, edit, or access actions like completing, archiving, or deleting.
- **Focus Mode:** Navigate to the Focus section or trigger it from a specific task. Use the timer and follow the highlighted task prompts.
- **Daily Themes:** Access the Daily Themes section to view or customize themes. Tasks matching the current day's theme may be highlighted or filtered in certain views.
- **Timeline:** Visit the Timeline view to see daily summaries and productivity scores.
- **Teams:** Go to the Teams section to create, join, or manage teams and team-related tasks. Use the "Add Sample Team" button for a quick demo setup.
- **Profile:** Access the Account/Profile section to customize your user information and avatar.

## 📁 Folder Structure (Simplified)

```
goal-flow-achievo/
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components (tasks, goals, forms, etc.)
│   ├── context/        # React Context providers (AppContext, AuthContext)
│   ├── hooks/          # Custom React hooks (use-toast)
│   ├── lib/            # Core logic, utilities, DB interactions (db.ts, prebuiltData.ts)
│   ├── pages/          # Top-level page components (Index, Teams, Timeline, etc.)
│   ├── styles/         # Global styles (if any beyond index.css)
│   ├── App.tsx         # Main application component, routing setup
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global CSS, Tailwind directives
├── .eslintrc.cjs       # ESLint configuration
├── .gitignore          # Git ignore rules
├── index.html          # HTML entry point
├── package.json        # Project metadata and dependencies
├── postcss.config.js   # PostCSS configuration
├── README.md           # This file
├── tailwind.config.js  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite configuration
```

## 🤝 Contributing

Contributions are welcome! Please follow standard fork/pull request procedures. (Further contribution guidelines can be added here).

## 📄 License

(Specify license details here, e.g., MIT License)

---

Happy Goal Achieving! 🎉
