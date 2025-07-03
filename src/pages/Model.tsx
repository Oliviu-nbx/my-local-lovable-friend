import { useState, useEffect } from "react";
import { Cpu, Activity, Database, Zap, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/Layout";

interface ModelInfo {
  name: string;
  status: 'connected' | 'disconnected' | 'loading';
  version: string;
  size: string;
  lastUsed: Date;
  responseTime: number;
  totalTokens: number;
}

export function Model() {
  const [modelInfo, setModelInfo] = useState<ModelInfo>({
    name: 'Llama 2',
    status: 'connected',
    version: '7B',
    size: '3.8 GB',
    lastUsed: new Date(),
    responseTime: 156,
    totalTokens: 24567
  });

  const [systemStats, setSystemStats] = useState({
    cpuUsage: 45,
    memoryUsage: 68,
    gpuUsage: 32
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStatus = async () => {
    setIsRefreshing(true);
    
    // Simulate API call to check model status
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSystemStats({
      cpuUsage: Math.floor(Math.random() * 80) + 20,
      memoryUsage: Math.floor(Math.random() * 40) + 50,
      gpuUsage: Math.floor(Math.random() * 60) + 20
    });
    
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'loading':
        return <RefreshCw className="w-5 h-5 text-warning animate-spin" />;
      default:
        return <XCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-success/20 text-success border-success/30">Connected</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">Disconnected</Badge>;
      case 'loading':
        return <Badge className="bg-warning/20 text-warning border-warning/30">Loading</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Model Status</h1>
            <p className="text-muted-foreground">Monitor your local LLM performance and health</p>
          </div>
          <Button 
            onClick={refreshStatus} 
            disabled={isRefreshing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Model Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Model Status</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusIcon(modelInfo.status)}
                    {getStatusBadge(modelInfo.status)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <p className="text-sm text-muted-foreground">Response Time</p>
              </div>
              <p className="text-2xl font-bold mt-2">{modelInfo.responseTime}ms</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                <p className="text-sm text-muted-foreground">Total Tokens</p>
              </div>
              <p className="text-2xl font-bold mt-2">{modelInfo.totalTokens.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <p className="text-sm text-muted-foreground">Model Size</p>
              </div>
              <p className="text-2xl font-bold mt-2">{modelInfo.size}</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Model Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              Model Information
            </CardTitle>
            <CardDescription>
              Detailed information about your current language model
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Model Name</p>
                <p className="font-medium">{modelInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="font-medium">{modelInfo.version}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Size</p>
                <p className="font-medium">{modelInfo.size}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Used</p>
                <p className="font-medium">{modelInfo.lastUsed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              System Performance
            </CardTitle>
            <CardDescription>
              Real-time system resource usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>CPU Usage</span>
                <span>{systemStats.cpuUsage}%</span>
              </div>
              <Progress value={systemStats.cpuUsage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memory Usage</span>
                <span>{systemStats.memoryUsage}%</span>
              </div>
              <Progress value={systemStats.memoryUsage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>GPU Usage</span>
                <span>{systemStats.gpuUsage}%</span>
              </div>
              <Progress value={systemStats.gpuUsage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common model management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">Restart Model</Button>
              <Button variant="outline" size="sm">Clear Cache</Button>
              <Button variant="outline" size="sm">Download Updates</Button>
              <Button variant="outline" size="sm">Export Logs</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default Model;