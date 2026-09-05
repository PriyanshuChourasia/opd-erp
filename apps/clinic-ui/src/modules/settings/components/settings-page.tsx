import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  increaseFontScale,
  decreaseFontScale,
  resetFontScale,
  setHelpModeEnabled,
  selectFontScale,
  selectHelpModeEnabled,
  FONT_SCALE_MIN,
  FONT_SCALE_MAX,
} from "@/store/ui-preferences-slice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Minus, Plus, RotateCcw } from "lucide-react";

function HelpModeCard() {
  const dispatch = useAppDispatch();
  const helpModeEnabled = useAppSelector(selectHelpModeEnabled);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Help Mode</CardTitle>
        <CardDescription>
          Show or hide the help badge and help links across the application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Help badges visible</p>
            <p className="text-xs text-muted-foreground">
              {helpModeEnabled
                ? "Help badges and links are shown on every page."
                : "Help badges and links are hidden. Toggle on to show them again."}
            </p>
          </div>
          <Switch
            checked={helpModeEnabled}
            onCheckedChange={(checked) => dispatch(setHelpModeEnabled(checked))}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsPage() {
  const dispatch = useAppDispatch();
  const fontScale = useAppSelector(selectFontScale);

  const canDecrease = fontScale > FONT_SCALE_MIN;
  const canIncrease = fontScale < FONT_SCALE_MAX;
  const isDefault = fontScale === 1.0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your preferences and application settings.
        </p>
      </div>

      {/* Text Size */}
      <Card>
        <CardHeader>
          <CardTitle>Text Size</CardTitle>
          <CardDescription>
            Adjust the text size across the entire application. Current scale: {Math.round(fontScale * 100)}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-9"
                disabled={!canDecrease}
                onClick={() => dispatch(decreaseFontScale())}
                title="Decrease text size"
              >
                <Minus className="size-4" />
              </Button>

              <span className="w-14 text-center text-sm font-medium tabular-nums">
                {Math.round(fontScale * 100)}%
              </span>

              <Button
                variant="outline"
                size="icon"
                className="size-9"
                disabled={!canIncrease}
                onClick={() => dispatch(increaseFontScale())}
                title="Increase text size"
              >
                <Plus className="size-4" />
              </Button>

              {!isDefault && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-muted-foreground"
                  onClick={() => dispatch(resetFontScale())}
                >
                  <RotateCcw className="size-3" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Live preview */}
          <div className="mt-4 rounded-md border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground mb-1">Preview</p>
            <p className="text-sm">The quick brown fox jumps over the lazy dog.</p>
            <p className="text-base font-medium mt-1">Patient appointment booking and prescription management.</p>
          </div>
        </CardContent>
      </Card>

      {/* Help Mode */}
      <HelpModeCard />
    </div>
  );
}
