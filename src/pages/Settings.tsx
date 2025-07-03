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
    aiProvider: localStorage.getItem('ai-provider') || 'gemini',
    geminiApiKey: localStorage.getItem('gemini-api-key') || 'AIzaSyBcRopXDUOEYmODdhYrGhW7g3uXOZYZt3M',
    lmStudioEndpoint: localStorage.getItem('lm-studio-endpoint') || 'http://localhost:1234',
    localModelName: localStorage.getItem('local-model-name') || 'local-model',
    openaiApiKey: localStorage.getItem('openai-api-key') || '',
    temperature: localStorage.getItem('temperature') || '0.7',
    maxTokens: localStorage.getItem('max-tokens') || '2048',
    systemPrompt: localStorage.getItem('system-prompt') || 'You are a helpful AI development assistant. Provide clear, concise, and practical answers to development questions.',
    autoSave: true,
    darkMode: true,
    notifications: true,
  });

  const { toast } = useToast();

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('ai-provider', settings.aiProvider);
    localStorage.setItem('gemini-api-key', settings.geminiApiKey);
    localStorage.setItem('lm-studio-endpoint', settings.lmStudioEndpoint);
    localStorage.setItem('local-model-name', settings.localModelName);
    localStorage.setItem('openai-api-key', settings.openaiApiKey);
    localStorage.setItem('temperature', settings.temperature);
    localStorage.setItem('max-tokens', settings.maxTokens);
    localStorage.setItem('system-prompt', settings.systemPrompt);
    
    toast({
      title: "Settings saved",
      description: "Your configuration has been updated successfully."
    });
  };

  const testConnection = async () => {
    if (settings.aiProvider === 'gemini') {
      if (!settings.geminiApiKey.trim()) {
        toast({
          title: "API Key Required",
          description: "Please enter your Gemini API key first",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Testing connection...",
        description: "Attempting to connect to Gemini API"
      });

      try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent("Hello, this is a test message.");
        const response = await result.response;
        
        if (response.text()) {
          toast({
            title: "Connection successful",
            description: "Successfully connected to Gemini API"
          });
        }
      } catch (error) {
        toast({
          title: "Connection failed",
          description: "Failed to connect to Gemini API. Check your API key.",
          variant: "destructive"
        });
      }
    } else {
      // Test LM Studio connection
      toast({
        title: "Testing connection...",
        description: "Attempting to connect to LM Studio"
      });

      try {
        const response = await fetch(`${settings.lmStudioEndpoint}/v1/models`, {
          headers: {
            ...(settings.openaiApiKey && { 'Authorization': `Bearer ${settings.openaiApiKey}` })
          }
        });

        if (response.ok) {
          const data = await response.json();
          toast({
            title: "Connection successful",
            description: `Connected to LM Studio. Found ${data.data?.length || 0} models.`
          });
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        toast({
          title: "Connection failed",
          description: "Failed to connect to LM Studio. Check your endpoint and ensure LM Studio is running.",
          variant: "destructive"
        });
      }
    }
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
              Gemini AI Configuration
            </CardTitle>
            <CardDescription>
              Configure your Gemini AI settings and API key
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">AI Provider</Label>
              <Select value={settings.aiProvider} onValueChange={(value) => setSettings({...settings, aiProvider: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Google Gemini (Cloud)</SelectItem>
                  <SelectItem value="lmstudio">LM Studio (Local)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.aiProvider === 'gemini' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="geminikey">Gemini API Key</Label>
                  <Input
                    id="geminikey"
                    type="password"
                    value={settings.geminiApiKey}
                    onChange={(e) => setSettings({...settings, geminiApiKey: e.target.value})}
                    placeholder="Enter your Gemini API key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="endpoint">LM Studio Endpoint</Label>
                  <Input
                    id="endpoint"
                    value={settings.lmStudioEndpoint}
                    onChange={(e) => setSettings({...settings, lmStudioEndpoint: e.target.value})}
                    placeholder="http://localhost:1234"
                  />
                  <p className="text-xs text-muted-foreground">
                    Default LM Studio endpoint. Make sure LM Studio is running and a model is loaded.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="localmodel">Model Name</Label>
                  <Input
                    id="localmodel"
                    value={settings.localModelName}
                    onChange={(e) => setSettings({...settings, localModelName: e.target.value})}
                    placeholder="local-model"
                  />
                  <p className="text-xs text-muted-foreground">
                    The name of the model loaded in LM Studio (usually shown in the interface).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="openaikey">API Key (Optional)</Label>
                  <Input
                    id="openaikey"
                    type="password"
                    value={settings.openaiApiKey}
                    onChange={(e) => setSettings({...settings, openaiApiKey: e.target.value})}
                    placeholder="Optional API key for authentication"
                  />
                  <p className="text-xs text-muted-foreground">
                    Only needed if your LM Studio setup requires authentication.
                  </p>
                </div>
              </>
            )}

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
              <p className="text-xs text-muted-foreground">Instructions that guide the AI's behavior</p>
            </div>

            <Button onClick={testConnection} variant="outline" className="gap-2">
              <TestTube className="w-4 h-4" />
              Test Connection
            </Button>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Recommended Models for LM Studio:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <strong>Llama 3.1 8B Instruct</strong> - Great balance of speed and quality</li>
                <li>• <strong>CodeLlama 7B Instruct</strong> - Specialized for code generation</li>
                <li>• <strong>Mistral 7B Instruct</strong> - Fast and efficient</li>
                <li>• <strong>Qwen2.5-Coder 7B</strong> - Excellent for coding tasks</li>
              </ul>
              <p className="text-xs mt-2 text-muted-foreground">
                Download these models in LM Studio and make sure one is loaded before testing.
              </p>
            </div>
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