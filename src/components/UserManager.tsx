import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Users, LogIn, LogOut } from "lucide-react";

interface User {
  id: string;
  username: string;
  password: string;
  settings: {
    aiProvider: string;
    geminiApiKey: string;
    lmStudioEndpoint: string;
    localModelName: string;
    openaiApiKey: string;
    temperature: string;
    maxTokens: string;
    systemPrompt: string;
  };
}

interface UserManagerProps {
  onUserLogin: (user: User) => void;
}

export function UserManager({ onUserLogin }: UserManagerProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "" });
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const { toast } = useToast();

  // Load users from CSV-like localStorage
  useEffect(() => {
    loadUsers();
    const savedCurrentUser = localStorage.getItem('current-user');
    if (savedCurrentUser) {
      try {
        const user = JSON.parse(savedCurrentUser);
        setCurrentUser(user);
        // Apply user settings
        applyUserSettings(user.settings);
      } catch (error) {
        console.error('Failed to load current user:', error);
      }
    }
  }, []);

  const loadUsers = () => {
    const userData = localStorage.getItem('users-csv');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUsers(parsed);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        setUsers([]);
      }
    }
  };

  const saveUsers = (updatedUsers: User[]) => {
    localStorage.setItem('users-csv', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const applyUserSettings = (settings: User['settings']) => {
    Object.entries(settings).forEach(([key, value]) => {
      const storageKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      if (key === 'aiProvider') localStorage.setItem('ai-provider', value);
      else if (key === 'geminiApiKey') localStorage.setItem('gemini-api-key', value);
      else if (key === 'lmStudioEndpoint') localStorage.setItem('lm-studio-endpoint', value);
      else if (key === 'localModelName') localStorage.setItem('local-model-name', value);
      else if (key === 'openaiApiKey') localStorage.setItem('openai-api-key', value);
      else if (key === 'systemPrompt') localStorage.setItem('system-prompt', value);
      else localStorage.setItem(storageKey, value);
    });
  };

  const getCurrentSettings = (): User['settings'] => ({
    aiProvider: localStorage.getItem('ai-provider') || 'gemini',
    geminiApiKey: localStorage.getItem('gemini-api-key') || '',
    lmStudioEndpoint: localStorage.getItem('lm-studio-endpoint') || 'http://localhost:1234',
    localModelName: localStorage.getItem('local-model-name') || 'local-model',
    openaiApiKey: localStorage.getItem('openai-api-key') || '',
    temperature: localStorage.getItem('temperature') || '0.7',
    maxTokens: localStorage.getItem('max-tokens') || '2048',
    systemPrompt: localStorage.getItem('system-prompt') || 'You are a helpful AI development assistant.'
  });

  const createUser = () => {
    if (!newUser.username.trim() || !newUser.password.trim()) {
      toast({
        title: "Invalid input",
        description: "Username and password are required",
        variant: "destructive"
      });
      return;
    }

    if (users.find(u => u.username === newUser.username)) {
      toast({
        title: "User exists",
        description: "A user with this username already exists",
        variant: "destructive"
      });
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      username: newUser.username,
      password: newUser.password,
      settings: getCurrentSettings()
    };

    const updatedUsers = [...users, user];
    saveUsers(updatedUsers);
    
    setNewUser({ username: "", password: "" });
    setShowCreateDialog(false);
    
    toast({
      title: "User created",
      description: `User ${user.username} has been created successfully`
    });
  };

  const deleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (currentUser?.id === userId) {
      setCurrentUser(null);
      localStorage.removeItem('current-user');
    }

    const updatedUsers = users.filter(u => u.id !== userId);
    saveUsers(updatedUsers);
    
    toast({
      title: "User deleted",
      description: `User ${user.username} has been deleted`
    });
  };

  const login = () => {
    const user = users.find(u => 
      u.username === loginData.username && u.password === loginData.password
    );

    if (!user) {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive"
      });
      return;
    }

    setCurrentUser(user);
    localStorage.setItem('current-user', JSON.stringify(user));
    applyUserSettings(user.settings);
    onUserLogin(user);
    
    setLoginData({ username: "", password: "" });
    setShowLoginDialog(false);
    
    toast({
      title: "Login successful",
      description: `Welcome back, ${user.username}!`
    });
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('current-user');
    
    toast({
      title: "Logged out",
      description: "You have been logged out successfully"
    });
  };

  const updateCurrentUserSettings = () => {
    if (!currentUser) return;

    const updatedUser = {
      ...currentUser,
      settings: getCurrentSettings()
    };

    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    saveUsers(updatedUsers);
    setCurrentUser(updatedUser);
    localStorage.setItem('current-user', JSON.stringify(updatedUser));
    
    toast({
      title: "Settings saved",
      description: "Your settings have been saved to your user profile"
    });
  };

  return (
    <div className="space-y-6">
      {/* Current User Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentUser ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Logged in as: {currentUser.username}</p>
                <p className="text-sm text-muted-foreground">ID: {currentUser.id}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={updateCurrentUserSettings} variant="outline" size="sm">
                  Save Current Settings
                </Button>
                <Button onClick={logout} variant="outline" size="sm" className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">No user logged in</p>
              <Button onClick={() => setShowLoginDialog(true)} className="gap-2">
                <LogIn className="w-4 h-4" />
                Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Panel (only show when admin is logged in) */}
      {currentUser?.username === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Create and manage user accounts. All data is stored locally in CSV format.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Users ({users.length})</h3>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create User
              </Button>
            </div>
            
            <div className="grid gap-3">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                  </div>
                  <div className="flex gap-2">
                    {user.username !== 'admin' && (
                      <Button
                        onClick={() => deleteUser(user.id)}
                        variant="outline"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-username">Username</Label>
              <Input
                id="new-username"
                value={newUser.username}
                onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createUser}>Create User</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Login</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username">Username</Label>
              <Input
                id="login-username"
                value={loginData.username}
                onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
                Cancel
              </Button>
              <Button onClick={login}>Login</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}