'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RotateCw, MoreHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Channel {
  id: string;
  name: string;
  purpose?: string;
}

type Priority = "Low" | "Medium" | "High";
type Status = "Todo" | "In Progress" | "Done" | "Cancelled" | "Backlog";

interface Task {
  id: string;
  type: "Documentation" | "Bug" | "Feature";
  title: string;
  status: Status;
  priority: Priority;
}

interface Analysis {
  id: string;
  summary: string | null;
  decisions: string[];
  actionItems: Task[];
  risks: string[];
  lastUpdated: string;
}

const NAV_ITEMS = [
  { id: 'daily-recap', label: 'Daily Recap' },
  { id: 'tasks', label: 'Tasks', count: (analysis: Analysis | null) => analysis?.actionItems?.length ?? 0 },
  { id: 'risks', label: 'Risks', count: (analysis: Analysis | null) => analysis?.risks?.length ?? 0 },
  { id: 'decisions', label: 'Decisions', count: (analysis: Analysis | null) => analysis?.decisions?.length ?? 0 },
];

const statusIcons: Record<Status, React.ReactNode> = {
  "Todo": <div className="h-2 w-2 rounded-full bg-gray-300" />,
  "In Progress": <div className="h-2 w-2 rounded-full bg-blue-500" />,
  "Done": <div className="h-2 w-2 rounded-full bg-green-500" />,
  "Cancelled": <div className="h-2 w-2 rounded-full bg-red-500" />,
  "Backlog": <div className="h-2 w-2 rounded-full bg-yellow-500" />,
};

const priorityIcons: Record<Priority, React.ReactNode> = {
  "Low": <ArrowUpDown className="h-4 w-4 rotate-180 text-gray-500" />,
  "Medium": <ArrowUpDown className="h-4 w-4 text-gray-500" />,
  "High": <ArrowUpDown className="h-4 w-4 text-red-500" />,
};

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('daily-recap');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const searchParams = useSearchParams();
  const selectedChannelId = searchParams.get('channel');

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (selectedChannelId) {
      fetchAnalysis(selectedChannelId);
    } else {
      setAnalysis(null);
    }
  }, [selectedChannelId]);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/channels');
      if (!response.ok) {
        throw new Error('Failed to fetch channels');
      }
      const data = await response.json();
      setChannels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysis = async (channelId: string) => {
    try {
      setAnalysisLoading(true);
      const response = await fetch(`/api/channels/${channelId}/analysis`);
      if (response.status === 404) {
        // No analysis found for this channel yet
        setAnalysis(null);
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      console.error('Error fetching analysis:', err);
      setAnalysis(null);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const renderDailyRecap = () => {
    if (analysisLoading) {
      return <div className="text-muted-foreground">Loading analysis...</div>;
    }

    if (!analysis) {
      return <div className="text-muted-foreground">No analysis available for this channel.</div>;
    }

    return (
      <div>
        {analysis.summary && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
          </div>
        )}
      </div>
    );
  };

  const renderTasks = () => {
    if (analysisLoading) {
      return <div className="text-muted-foreground">Loading tasks...</div>;
    }

    if (!analysis?.actionItems?.length) {
      return <div className="text-muted-foreground">No tasks found for this channel.</div>;
    }

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedTasks = analysis.actionItems.slice(startIndex, endIndex);

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            className="flex h-8 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Filter tasks..."
          />
          <Button variant="outline" size="sm" className="h-8 px-2">
            Status
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-2">
            Priority
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-2 ml-auto">
            View
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]">
                <Checkbox
                  checked={selectedTasks.length === paginatedTasks.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTasks(paginatedTasks.map(t => t.id));
                    } else {
                      setSelectedTasks([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="w-[30px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedTasks.includes(task.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTasks([...selectedTasks, task.id]);
                      } else {
                        setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">
                      {task.type}
                    </Badge>
                    {task.title}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {statusIcons[task.status]}
                    <span className="text-sm">{task.status}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {priorityIcons[task.priority]}
                    <span className="text-sm">{task.priority}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            {selectedTasks.length} of {analysis.actionItems.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <select
                className="h-8 w-[70px] rounded-md border border-input bg-transparent px-2 py-0.5 text-sm"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="40">40</option>
                <option value="50">50</option>
              </select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {currentPage} of {Math.ceil(analysis.actionItems.length / rowsPerPage)}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(analysis.actionItems.length / rowsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(analysis.actionItems.length / rowsPerPage)}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage(Math.ceil(analysis.actionItems.length / rowsPerPage))}
                disabled={currentPage === Math.ceil(analysis.actionItems.length / rowsPerPage)}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRisks = () => {
    if (analysisLoading) {
      return <div className="text-muted-foreground">Loading risks...</div>;
    }

    if (!analysis?.risks?.length) {
      return <div className="text-muted-foreground">No risks identified for this channel.</div>;
    }

    return (
      <div className="space-y-4">
        {analysis.risks.map((risk, index) => (
          <div key={index} className="flex flex-col space-y-2 rounded-lg border p-4">
            <div className="flex items-start justify-between space-x-4">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{risk}</p>
                <div className="flex items-center pt-2">
                  <Badge variant="danger" className="text-xs">Risk</Badge>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDecisions = () => {
    if (analysisLoading) {
      return <div className="text-muted-foreground">Loading decisions...</div>;
    }

    if (!analysis?.decisions?.length) {
      return <div className="text-muted-foreground">No decisions recorded for this channel.</div>;
    }

    return (
      <div className="space-y-4">
        {analysis.decisions.map((decision, index) => (
          <div key={index} className="flex flex-col space-y-2 rounded-lg border p-4">
            <div className="flex items-start justify-between space-x-4">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{decision}</p>
                <div className="flex items-center pt-2">
                  <Badge variant="success" className="text-xs">Decision</Badge>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r">
        <div className="h-14 border-b flex items-center px-4">
          <h2 className="text-sm font-medium">Channels</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-auto"
            onClick={fetchChannels}
            disabled={loading}
          >
            <RotateCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-3.5rem)]">
          {error && (
            <div className="p-4 text-sm text-red-500">
              {error}
            </div>
          )}
          {loading ? (
            <div className="space-y-3 p-4">
              <div className="h-10 bg-gray-100 animate-pulse rounded" />
              <div className="h-10 bg-gray-100 animate-pulse rounded" />
              <div className="h-10 bg-gray-100 animate-pulse rounded" />
            </div>
          ) : channels.length === 0 ? (
            <div className="p-4 text-muted-foreground">No channels found.</div>
          ) : (
            <div className="grid gap-2 p-4">
              {channels.map((channel) => (
                <a
                  key={channel.id}
                  href={`/channels?channel=${channel.id}`}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                    selectedChannelId === channel.id
                      ? "bg-gray-100 text-gray-900"
                      : "hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  # {channel.name}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {selectedChannelId ? (
          <div className="flex flex-col h-full">
            <div className="h-14 border-b flex items-center px-4">
              <div className="flex items-center space-x-1">
                <h2 className="text-sm font-medium mr-6">
                  #{channels.find(c => c.id === selectedChannelId)?.name}
                </h2>
                {NAV_ITEMS.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 relative",
                      activeTab === item.id
                        ? "bg-[#0f172a] text-white hover:bg-[#0f172a]/90"
                        : "hover:bg-transparent hover:text-foreground"
                    )}
                    onClick={() => setActiveTab(item.id)}
                  >
                    {item.label}
                    {item.count && analysis && item.count(analysis) > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="ml-2 h-4 w-4 rounded-full p-0 text-xs font-medium"
                      >
                        {item.count(analysis)}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
            <div className="p-4">
              {activeTab === 'daily-recap' && (
                <div>
                  <h3 className="text-sm font-medium mb-4">Summary</h3>
                  {renderDailyRecap()}
                </div>
              )}
              {activeTab === 'tasks' && (
                <div>
                  <h3 className="text-sm font-medium mb-4">Tasks</h3>
                  {renderTasks()}
                </div>
              )}
              {activeTab === 'risks' && (
                <div>
                  <h3 className="text-sm font-medium mb-4">Risks</h3>
                  {renderRisks()}
                </div>
              )}
              {activeTab === 'decisions' && (
                <div>
                  <h3 className="text-sm font-medium mb-4">Decisions</h3>
                  {renderDecisions()}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            Select a channel from the sidebar
          </div>
        )}
      </div>
    </div>
  );
}
