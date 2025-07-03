// Simple CSV-like storage utility for user management
// This simulates CSV storage using localStorage

interface UserRecord {
  id: string;
  username: string;
  password: string;
  settings: string; // JSON stringified settings
}

export const createDefaultAdmin = () => {
  const users = getUsers();
  const adminExists = users.find(u => u.username === 'admin');
  
  if (!adminExists) {
    const admin: UserRecord = {
      id: 'admin-001',
      username: 'admin',
      password: 'admin123',
      settings: JSON.stringify({
        aiProvider: 'gemini',
        geminiApiKey: 'AIzaSyBcRopXDUOEYmODdhYrGhW7g3uXOZYZt3M',
        lmStudioEndpoint: 'http://localhost:1234',
        localModelName: 'local-model',
        openaiApiKey: '',
        temperature: '0.7',
        maxTokens: '2048',
        systemPrompt: 'You are a helpful AI development assistant.'
      })
    };
    
    users.push(admin);
    saveUsers(users);
    console.log('Default admin user created: admin/admin123');
  }
};

export const getUsers = (): UserRecord[] => {
  try {
    const data = localStorage.getItem('users-csv');
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
};

export const saveUsers = (users: UserRecord[]) => {
  localStorage.setItem('users-csv', JSON.stringify(users));
};

export const exportToCSV = (): string => {
  const users = getUsers();
  const headers = ['id', 'username', 'password', 'settings'];
  
  const csvContent = [
    headers.join(','),
    ...users.map(user => [
      user.id,
      user.username,
      user.password,
      `"${user.settings.replace(/"/g, '""')}"` // Escape quotes in JSON
    ].join(','))
  ].join('\n');
  
  return csvContent;
};

export const importFromCSV = (csvContent: string): boolean => {
  try {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return false;
    
    const headers = lines[0].split(',');
    if (!headers.includes('id') || !headers.includes('username')) return false;
    
    const users: UserRecord[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= 4) {
        users.push({
          id: values[0],
          username: values[1],
          password: values[2],
          settings: values[3].replace(/""/g, '"') // Unescape quotes
        });
      }
    }
    
    saveUsers(users);
    return true;
  } catch (error) {
    console.error('Error importing CSV:', error);
    return false;
  }
};

const parseCSVLine = (line: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
};

// Initialize default admin on import
createDefaultAdmin();