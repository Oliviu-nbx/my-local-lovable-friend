import { Layout } from '@/components/Layout';
import { UserManager } from '@/components/UserManager';

export function Development() {
  const handleUserLogin = (user: any) => {
    // User login logic is handled in UserManager
    console.log('User logged in:', user.username);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Development Tools</h1>
          <p className="text-muted-foreground">Manage users and development settings</p>
        </div>
        
        <UserManager onUserLogin={handleUserLogin} />
      </div>
    </Layout>
  );
}

export default Development;