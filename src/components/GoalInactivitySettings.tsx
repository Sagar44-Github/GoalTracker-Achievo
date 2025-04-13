import { useApp } from "@/context/AppContext";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function GoalInactivitySettings() {
  const appContext = useApp();
  const inactivityThreshold = appContext?.inactivityThreshold || 10;
  const setInactivityThreshold =
    appContext?.setInactivityThreshold || (() => {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Goal Inactivity Settings</CardTitle>
        <CardDescription>
          Receive reminders when goals have been inactive for a period of time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Label htmlFor="inactivity-threshold">
            Show notification when a goal has been inactive for:
          </Label>
          <RadioGroup
            defaultValue={inactivityThreshold.toString()}
            onValueChange={(value) =>
              setInactivityThreshold(parseInt(value, 10))
            }
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="5" id="threshold-5" />
              <Label htmlFor="threshold-5">5 days</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="10" id="threshold-10" />
              <Label htmlFor="threshold-10">10 days</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="15" id="threshold-15" />
              <Label htmlFor="threshold-15">15 days</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="30" id="threshold-30" />
              <Label htmlFor="threshold-30">30 days</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
