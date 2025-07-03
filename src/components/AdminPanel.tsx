import { useState, useEffect } from "react";
import { Users, Trash2, Plus, BarChart3, AlertTriangle, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  username: string;
  password: string;
  settings: string;
}

export function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
    const maintenance = localStorage.getItem('maintenance-mode') === 'true';
    setMaintenanceMode(maintenance);
  }, []);

  const loadUsers = () => {
    try {
      const usersData = localStorage.getItem('users-csv');
      if (usersData) {
        setUsers(JSON.parse(usersData));
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const saveUsers = (updatedUsers: User[]) => {
    localStorage.setItem('users-csv', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const addUser = () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      toast({
        title: "Error",
        description: "Username and password are required",
        variant: "destructive"
      });
      return;
    }

    const userExists = users.find(u => u.username === newUsername);
    if (userExists) {
      toast({
        title: "Error", 
        description: "Username already exists",
        variant: "destructive"
      });
      return;
    }

    const newUser: User = {
      id: (Date.now()).toString(),
      username: newUsername,
      password: newPassword,
      settings: JSON.stringify({
        aiProvider: 'gemini',
        geminiApiKey: '',
        temperature: '0.7',
        maxTokens: '2048'
      })
    };

    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);
    setNewUsername('');
    setNewPassword('');
    
    toast({
      title: "Success",
      description: "User created successfully"
    });
  };

  const deleteUser = (userId: string) => {
    if (userId === '1') {
      toast({
        title: "Error",
        description: "Cannot delete admin user",
        variant: "destructive"
      });
      return;
    }

    const updatedUsers = users.filter(u => u.id !== userId);
    saveUsers(updatedUsers);
    
    toast({
      title: "Success", 
      description: "User deleted successfully"
    });
  };

  const toggleMaintenanceMode = (enabled: boolean) => {
    localStorage.setItem('maintenance-mode', enabled.toString());
    setMaintenanceMode(enabled);
    
    toast({
      title: enabled ? "Maintenance Mode Enabled" : "Maintenance Mode Disabled",
      description: enabled ? "Non-admin users will see maintenance message" : "All users can access the application"
    });
  };

  const hardReset = () => {
    // Clear all application data except admin user
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (!key.includes('admin') && key !== 'users-csv') {
        localStorage.removeItem(key);
      }
    });
    
    // Reset users to just admin
    const adminUser = users.find(u => u.id === '1');
    if (adminUser) {
      saveUsers([adminUser]);
    }
    
    localStorage.setItem('maintenance-mode', 'false');
    setMaintenanceMode(false);
    
    toast({
      title: "Hard Reset Complete",
      description: "All application data has been cleared"
    });
  };

  const getProjectCount = () => {
    try {
      const projects = localStorage.getItem('projects');
      return projects ? JSON.parse(projects).length : 0;
    } catch {
      return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Application Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Application Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-primary">{users.length}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-primary">{getProjectCount()}</div>
              <div className="text-sm text-muted-foreground">Total Projects</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Add and manage application users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New User */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addUser} className="gap-2">
                <Plus className="w-4 h-4" />
                Add User
              </Button>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-2">
            <Label>Existing Users</Label>
            <div className="border rounded-md">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                  <div>
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                  </div>
                  {user.id !== '1' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete user "{user.username}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteUser(user.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {user.id === '1' && (
                    <div className="text-xs text-muted-foreground">Admin</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            System Controls
          </CardTitle>
          <CardDescription>
            Manage application-wide settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">Show maintenance message to non-admin users</p>
            </div>
            <Switch
              checked={maintenanceMode}
              onCheckedChange={toggleMaintenanceMode}
            />
          </div>

          <div className="pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Database className="w-4 h-4" />
                  Hard Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hard Reset Application</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete ALL application data including projects, chats, and users (except admin). 
                    This action cannot be undone. Are you absolutely sure?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={hardReset} className="bg-destructive hover:bg-destructive/90">
                    Reset Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}