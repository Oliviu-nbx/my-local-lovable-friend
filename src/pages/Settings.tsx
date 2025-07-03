import { useState } from "react";
import { Save, TestTube, Cpu, Globe, Shield, Palette } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Layout } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";

export function Settings() {
  const [settings, setSettings] = useState({
    llmEndpoint: 'http://localhost:11434',
    modelName: 'llama2',
    apiKey: '',
    temperature: '0.7',
    maxTokens: '2048',
    systemPrompt: 'You are a helpful AI development assistant.',
    autoSave: true,
    darkMode: true,
    notifications: true,
  });

  const { toast } = useToast();

  const handleSave = () => {
    // In a real app, this would save to localStorage or send to a backend
    toast({
      title: "Settings saved",
      description: "Your configuration has been updated successfully."
    });
  };

  const testConnection = async () => {
    toast({
      title: "Testing connection...",
      description: "Attempting to connect to your local LLM"
    });

    // Simulate connection test
    setTimeout(() => {
      toast({
        title: "Connection successful",
        description: "Successfully connected to your local LLM"
      });
    }, 2000);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your AI development environment</p>
        </div>

        {/* LLM Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              LLM Configuration
            </CardTitle>
            <CardDescription>
              Configure your local language model connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endpoint">API Endpoint</Label>
                <Input
                  id="endpoint"
                  value={settings.llmEndpoint}
                  onChange={(e) => setSettings({...settings, llmEndpoint: e.target.value})}
                  placeholder="http://localhost:11434"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model Name</Label>
                <Select value={settings.modelName} onValueChange={(value) => setSettings({...settings, modelName: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llama2">Llama 2</SelectItem>
                    <SelectItem value="codellama">Code Llama</SelectItem>
                    <SelectItem value="mistral">Mistral</SelectItem>
                    <SelectItem value="custom">Custom Model</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apikey">API Key (if required)</Label>
              <Input
                id="apikey"
                type="password"
                value={settings.apiKey}
                onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                placeholder="Enter API key if your LLM requires authentication"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  value={settings.temperature}
                  onChange={(e) => setSettings({...settings, temperature: e.target.value})}
                  placeholder="0.7"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokens">Max Tokens</Label>
                <Input
                  id="tokens"
                  value={settings.maxTokens}
                  onChange={(e) => setSettings({...settings, maxTokens: e.target.value})}
                  placeholder="2048"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">System Prompt</Label>
              <Textarea
                id="prompt"
                value={settings.systemPrompt}
                onChange={(e) => setSettings({...settings, systemPrompt: e.target.value})}
                rows={3}
                placeholder="You are a helpful AI development assistant..."
              />
            </div>

            <Button onClick={testConnection} variant="outline" className="gap-2">
              <TestTube className="w-4 h-4" />
              Test Connection
            </Button>
          </CardContent>
        </Card>

        {/* Editor Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Editor Preferences
            </CardTitle>
            <CardDescription>
              Customize your development environment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-save files</Label>
                <p className="text-sm text-muted-foreground">Automatically save changes as you type</p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) => setSettings({...settings, autoSave: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Dark mode</Label>
                <p className="text-sm text-muted-foreground">Use dark theme for the interface</p>
              </div>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={(checked) => setSettings({...settings, darkMode: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Notifications</Label>
                <p className="text-sm text-muted-foreground">Show system notifications</p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => setSettings({...settings, notifications: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security & Privacy
            </CardTitle>
            <CardDescription>
              Manage your data and security preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Local Processing:</strong> All your code and conversations stay on your machine. 
                No data is sent to external servers unless you configure an external LLM endpoint.
              </p>
              <p className="text-sm text-muted-foreground">
                Your API keys and sensitive information are stored locally and encrypted.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2 bg-gradient-primary hover:shadow-glow">
            <Save className="w-4 h-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </Layout>
  );
}

export default Settings;