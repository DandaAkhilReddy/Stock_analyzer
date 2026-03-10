'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  getApplications,
  getStats,
  scanEmails,
  getGmailStatus,
  connectGmail,
  Application,
  Stats,
} from '@/lib/api';
import StatsCards from './StatsCards';
import ApplicationList from './ApplicationList';
import Timeline from './Timeline';
import { DashboardSkeleton } from './skeletons';
import { ThemeToggle } from './theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Briefcase,
  RefreshCw,
  LogOut,
  LayoutDashboard,
  List,
  Clock,
  Mail,
} from 'lucide-react';

type ViewMode = 'dashboard' | 'list' | 'timeline';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Dashboard() {
  const { user, signOut, signInWithGoogle, getToken } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hasAutoScanned, setHasAutoScanned] = useState(false);
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);
  const [connectingGmail, setConnectingGmail] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const [appsData, statsData] = await Promise.all([
        getApplications(token, filters),
        getStats(token),
      ]);

      setApplications(appsData.applications);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load applications',
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-scan Gmail on first load
  useEffect(() => {
    const initDashboard = async () => {
      const token = await getToken();
      if (!token) return;

      // Fetch existing data first
      await fetchData();

      // Auto-scan Gmail on first load (only once per session)
      if (!hasAutoScanned) {
        try {
          const gmailStatus = await getGmailStatus(token);
          setGmailConnected(gmailStatus.connected);
          if (gmailStatus.connected) {
            setScanning(true);
            const result = await scanEmails(token);
            toast({
              title: 'Gmail Synced',
              description: `Found ${result.new} new application${result.new !== 1 ? 's' : ''}`,
            });
            await fetchData(); // Refresh after scan
            setScanning(false);
          }
        } catch (error) {
          console.log('Auto-scan skipped:', error);
          setGmailConnected(false);
          setScanning(false);
        }
        setHasAutoScanned(true);
      }
    };
    initDashboard();
  }, []);

  // Refetch when filter changes
  useEffect(() => {
    if (hasAutoScanned) {
      fetchData();
    }
  }, [statusFilter]);

  const handleScanEmails = async () => {
    try {
      setScanning(true);
      const token = await getToken();
      if (!token) return;

      const result = await scanEmails(token);
      toast({
        title: 'Scan Complete',
        description: result.message,
      });
      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Scan Failed',
        description: error.message || 'Failed to scan emails',
      });
    } finally {
      setScanning(false);
    }
  };

  const handleApplicationUpdated = () => {
    fetchData();
  };

  const handleConnectGmail = async () => {
    try {
      setConnectingGmail(true);
      const { user: signedInUser, accessToken } = await signInWithGoogle();

      if (accessToken) {
        const idToken = await signedInUser.getIdToken();
        await connectGmail(idToken, {
          accessToken,
          refreshToken: '',
          tokenExpiry: new Date(Date.now() + 3600000).toISOString(),
        });
        setGmailConnected(true);
        toast({
          title: 'Gmail Connected',
          description: 'Your Gmail account has been connected successfully.',
        });
        // Trigger a scan after connecting
        handleScanEmails();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: error.message || 'Failed to connect Gmail',
      });
    } finally {
      setConnectingGmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Job Tracker</span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user?.photoURL && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
                <AvatarFallback>
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            )}
            <span className="hidden text-sm text-muted-foreground sm:block">
              {user?.displayName || user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign Out">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Action Bar */}
      <div className="border-b bg-background">
        <div className="container py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* View Tabs */}
            <Tabs
              value={viewMode}
              onValueChange={(value) => setViewMode(value as ViewMode)}
            >
              <TabsList>
                <TabsTrigger value="dashboard" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <List className="h-4 w-4" />
                  List
                </TabsTrigger>
                <TabsTrigger value="timeline" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Timeline
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant={gmailConnected ? "outline" : "default"}
                onClick={handleConnectGmail}
                disabled={connectingGmail}
                className="gap-2"
              >
                <Mail className={`h-4 w-4 ${connectingGmail ? 'animate-pulse' : ''}`} />
                {connectingGmail ? 'Connecting...' : gmailConnected ? 'Reconnect Gmail' : 'Connect Gmail'}
              </Button>
              <Button
                variant="outline"
                onClick={handleScanEmails}
                disabled={scanning || gmailConnected === false}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
                {scanning ? 'Syncing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container py-8">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DashboardSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key={viewMode}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={fadeInUp}
            >
              {viewMode === 'dashboard' && (
                <motion.div className="space-y-8" variants={stagger}>
                  <StatsCards stats={stats} />
                  <div className="grid gap-8 lg:grid-cols-2">
                    <motion.div variants={fadeInUp}>
                      <Card>
                        <CardHeader>
                          <CardTitle>Recent Applications</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ApplicationList
                            applications={applications.slice(0, 5)}
                            onUpdate={handleApplicationUpdated}
                            compact
                          />
                        </CardContent>
                      </Card>
                    </motion.div>
                    <motion.div variants={fadeInUp}>
                      <Card>
                        <CardHeader>
                          <CardTitle>Application Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Timeline applications={applications.slice(0, 5)} />
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {viewMode === 'list' && (
                <div className="space-y-4">
                  {/* Filter */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Filter by Status:</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Applied">Applied</SelectItem>
                        <SelectItem value="Interview">Interview</SelectItem>
                        <SelectItem value="Offer">Offer</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      <ApplicationList
                        applications={applications}
                        onUpdate={handleApplicationUpdated}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {viewMode === 'timeline' && (
                <Card>
                  <CardContent className="pt-6">
                    <Timeline applications={applications} />
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
}
