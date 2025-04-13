import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { DailyTheme } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, PlusCircle, Palette } from "lucide-react";

export function DailyThemeSettings() {
  const appContext = useApp();
  const dailyThemes = appContext?.dailyThemes || [];
  const isDailyThemeModeEnabled = appContext?.isDailyThemeModeEnabled || false;
  const toggleDailyThemeMode = appContext?.toggleDailyThemeMode || (() => {});
  const updateDailyTheme = appContext?.updateDailyTheme || (async () => "");
  const currentDayTheme = appContext?.currentDayTheme || null;

  const [editingTheme, setEditingTheme] = useState<DailyTheme | null>(null);
  const [newTag, setNewTag] = useState<string>("");

  const handleSaveTheme = async () => {
    if (editingTheme) {
      await updateDailyTheme(editingTheme);
      setEditingTheme(null);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && editingTheme) {
      setEditingTheme({
        ...editingTheme,
        tags: [...editingTheme.tags, newTag.trim().toLowerCase()],
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (editingTheme) {
      setEditingTheme({
        ...editingTheme,
        tags: editingTheme.tags.filter((tag) => tag !== tagToRemove),
      });
    }
  };

  const isDayActive = (day: string) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0-6, where 0 is Sunday and 6 is Saturday

    if ((currentDay === 0 || currentDay === 6) && day === "weekend") {
      return true;
    }

    const dayMap: { [key: string]: number } = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 0,
    };

    return dayMap[day.toLowerCase()] === currentDay;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Daily Themes Mode
          </h2>
          <p className="text-sm text-muted-foreground">
            Assign meaningful themes to each day of the week to enhance your
            productivity rhythm.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="theme-mode-toggle"
            checked={isDailyThemeModeEnabled}
            onCheckedChange={toggleDailyThemeMode}
          />
          <Label htmlFor="theme-mode-toggle">
            {isDailyThemeModeEnabled ? "Enabled" : "Disabled"}
          </Label>
        </div>
      </div>

      {currentDayTheme && isDailyThemeModeEnabled && (
        <Card
          className="border-2"
          style={{ borderColor: currentDayTheme.color || "var(--border)" }}
        >
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Today's Theme: {currentDayTheme.name}</span>
              <Badge
                variant="outline"
                style={{
                  backgroundColor: currentDayTheme.color,
                  color: "white",
                }}
              >
                Active
              </Badge>
            </CardTitle>
            <CardDescription>{currentDayTheme.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <blockquote
              className="italic border-l-4 pl-4 my-4"
              style={{ borderColor: currentDayTheme.color }}
            >
              "{currentDayTheme.quote}"
            </blockquote>
            <div className="flex flex-wrap gap-2 mt-4">
              {currentDayTheme.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {dailyThemes.map((theme) => (
          <Card
            key={theme.id}
            className={`relative ${
              isDayActive(theme.day) && isDailyThemeModeEnabled ? "ring-2" : ""
            }`}
            style={{
              borderColor: theme.color,
              boxShadow:
                isDayActive(theme.day) && isDailyThemeModeEnabled
                  ? `0 0 0 2px ${theme.color}`
                  : "none",
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="capitalize flex justify-between items-center">
                <span>{theme.day}</span>
                {isDayActive(theme.day) && isDailyThemeModeEnabled && (
                  <Badge
                    variant="outline"
                    style={{ backgroundColor: theme.color, color: "white" }}
                  >
                    Today
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="font-medium text-base">
                {theme.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm">{theme.description}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {theme.tags.slice(0, 3).map((tag) => (
                  <Badge variant="secondary" key={tag} className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {theme.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{theme.tags.length - 3} more
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setEditingTheme({ ...theme })}
              >
                <Palette className="mr-2 h-4 w-4" />
                Edit Theme
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {editingTheme && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Edit Theme for {editingTheme.day}</CardTitle>
              <CardDescription>
                Customize this day's theme and related tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme-name">Theme Name</Label>
                <Input
                  id="theme-name"
                  value={editingTheme.name}
                  onChange={(e) =>
                    setEditingTheme({ ...editingTheme, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme-description">Description</Label>
                <Textarea
                  id="theme-description"
                  value={editingTheme.description || ""}
                  onChange={(e) =>
                    setEditingTheme({
                      ...editingTheme,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme-quote">Daily Quote</Label>
                <Textarea
                  id="theme-quote"
                  value={editingTheme.quote || ""}
                  onChange={(e) =>
                    setEditingTheme({ ...editingTheme, quote: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme-color">Theme Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="theme-color"
                    type="color"
                    value={editingTheme.color || "#000000"}
                    onChange={(e) =>
                      setEditingTheme({
                        ...editingTheme,
                        color: e.target.value,
                      })
                    }
                    className="w-12 h-10 p-1"
                  />
                  <div
                    className="w-10 h-10 rounded-md border"
                    style={{ backgroundColor: editingTheme.color || "#000000" }}
                  />
                  <Input
                    value={editingTheme.color || "#000000"}
                    onChange={(e) =>
                      setEditingTheme({
                        ...editingTheme,
                        color: e.target.value,
                      })
                    }
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Related Tags</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-16">
                  {editingTheme.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a new tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  />
                  <Button type="button" size="icon" onClick={handleAddTag}>
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tasks with these tags will be highlighted on this day
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setEditingTheme(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTheme}>Save Changes</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
