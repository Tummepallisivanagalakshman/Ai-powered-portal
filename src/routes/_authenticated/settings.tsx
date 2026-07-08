import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Eye, Bell, Globe, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [{ title: "Settings — CareerSuccess" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [digestAlerts, setDigestAlerts] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [language, setLanguage] = useState("English");

  const handleSave = () => {
    toast.success("Preferences updated successfully!");
  };

  const handleDeleteAccount = () => {
    const confirmation = window.confirm("Are you sure you want to permanently delete your account? This action is irreversible.");
    if (confirmation) {
      toast.success("Account deletion request submitted.");
    }
  };

  return (
    <AppShell
      title="Settings"
      subtitle="Manage your theme options, notification alerts, language, and privacy settings."
      actions={
        <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-xs h-9">
          Save Settings
        </Button>
      }
    >
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Notification settings */}
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
          <h3 className="font-display font-semibold text-base flex items-center gap-2">
            <Bell className="h-4.5 w-4.5 text-blue-600" /> Notifications
          </h3>
          <p className="text-xs text-muted-foreground">Select how you want to be alerted on resume scans and mock interview readiness.</p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <Checkbox
                id="email-alerts"
                checked={emailAlerts}
                onCheckedChange={(checked) => setEmailAlerts(!!checked)}
              />
              <label htmlFor="email-alerts" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                Email alerts on completed analyses
              </label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="digest-alerts"
                checked={digestAlerts}
                onCheckedChange={(checked) => setDigestAlerts(!!checked)}
              />
              <label htmlFor="digest-alerts" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                Weekly career digest & recommended tasks
              </label>
            </div>
          </div>
        </div>

        {/* Account & Language */}
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
          <h3 className="font-display font-semibold text-base flex items-center gap-2">
            <Globe className="h-4.5 w-4.5 text-purple-600" /> Regional & Language
          </h3>

          <div className="space-y-1 max-w-xs">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Preferred Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full h-10 text-xs rounded-xl border border-border/60 bg-background px-3 focus:outline-none focus:border-blue-600"
            >
              <option value="English">English (United States)</option>
              <option value="Spanish">Español</option>
              <option value="French">Français</option>
              <option value="German">Deutsch</option>
            </select>
          </div>
        </div>

        {/* Privacy */}
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
          <h3 className="font-display font-semibold text-base flex items-center gap-2">
            <Eye className="h-4.5 w-4.5 text-green-500" /> Privacy & Visibility
          </h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="profile-visibility"
                checked={profileVisible}
                onCheckedChange={(checked) => setProfileVisible(!!checked)}
              />
              <label htmlFor="profile-visibility" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                Make my profile visible to recruiters matching my target roles
              </label>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal max-w-lg pl-6">
              When checked, your ATS compatibility scores and matching resume credentials can be surfaced to recruiters posting matching jobs on the network.
            </p>
          </div>
        </div>

        {/* Critical danger zone */}
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 shadow-soft space-y-4">
          <h3 className="font-display font-semibold text-base flex items-center gap-2 text-red-600">
            <ShieldAlert className="h-4.5 w-4.5" /> Danger Zone
          </h3>
          <p className="text-xs text-muted-foreground">Deleting your account is permanent. All historical resume scorecards and interview videos will be deleted immediately.</p>
          
          <Button
            type="button"
            onClick={handleDeleteAccount}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-10 px-5 rounded-xl transition-transform active:scale-[0.98]"
          >
            Delete Account
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
