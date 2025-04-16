import { Team, TeamMember, TeamTask } from "./db";

// Define role-based permissions
export type Permission =
  | "assign_tasks" // Can assign tasks to team members
  | "edit_team" // Can edit team details
  | "manage_members" // Can add/remove members
  | "delete_team" // Can delete the team
  | "promote_members" // Can change member roles
  | "view_analytics"; // Can view team analytics

// Map roles to permissions
export const rolePermissions: Record<TeamMember["role"], Permission[]> = {
  captain: [
    "assign_tasks",
    "edit_team",
    "manage_members",
    "delete_team",
    "promote_members",
    "view_analytics",
  ],
  "vice-captain": [
    "assign_tasks",
    "edit_team",
    "manage_members",
    "view_analytics",
  ],
  member: ["view_analytics"],
};

// Check if a team member has a specific permission
export const hasPermission = (
  member: TeamMember,
  permission: Permission
): boolean => {
  if (!member || !member.role) return false;
  return rolePermissions[member.role].includes(permission);
};

// Calculate team statistics
export const calculateTeamStats = (
  team: Team,
  members: TeamMember[],
  tasks: TeamTask[]
) => {
  return {
    totalMembers: members.length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((task) => task.completed).length,
    totalPoints: members.reduce((sum, member) => sum + member.points, 0),
    // Calculate completion rate
    completionRate: tasks.length
      ? (tasks.filter((task) => task.completed).length / tasks.length) * 100
      : 0,
    // Find top performers (top 3 by points)
    topPerformers: [...members]
      .sort((a, b) => b.points - a.points)
      .slice(0, 3)
      .map((member) => ({
        id: member.userId,
        name: member.displayName,
        points: member.points,
      })),
  };
};

// Generate a formatted leaderboard from team members
export const generateLeaderboard = (members: TeamMember[]) => {
  return [...members]
    .sort((a, b) => b.points - a.points)
    .map((member, index) => ({
      rank: index + 1,
      id: member.userId,
      name: member.displayName,
      points: member.points,
      role: member.role,
    }));
};

// Calculate point value for a task based on priority
export const calculateTaskPoints = (priority: TeamTask["priority"]): number => {
  switch (priority) {
    case "high":
      return 5;
    case "medium":
      return 3;
    case "low":
      return 1;
    default:
      return 1;
  }
};
