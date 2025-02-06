'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ReloadIcon, Spinner } from '@/components/ui/icons'

interface Message {
  ts: string
  text: string
  user?: string
  username?: string
  real_name?: string
  thread_ts?: string
  reply_count?: number
}

interface ChannelSummary {
  id: string
  name: string
  purpose: string
  lastUpdated: Date
  analysisId: string | null
  error?: string
  messages: Message[]
}

interface ChannelAnalysis {
  id: string
  channelId: string
  summary: string | null
  decisions: string[]
  progress: string[]
  questions: string[]
  actionItems: any[]
  risks: any[]
  lastUpdated: Date
}

interface Highlight {
  date: string
  summary: string
  decisions: string[]
  progress: string[]
  questions: string[]
  actionItems: string[]
}

function parseAnalysisData(data: any) {
  if (typeof data === 'string' && data.startsWith('{')) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  }
  return data;
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelSummary[]>([])
  const [analysis, setAnalysis] = useState<ChannelAnalysis[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [view, setView] = useState<'recap' | 'tasks' | 'risks'>('recap')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [channelsResponse, analysisResponse] = await Promise.all([
          fetch('/api/channels'),
          fetch('/api/analysis')
        ])

        const channelsData = await channelsResponse.json()
        const analysisData = await analysisResponse.json()
        
        console.log('Analysis Data:', analysisData)
        console.log('Analysis Data Type:', typeof analysisData)
        console.log('Is Array:', Array.isArray(analysisData))
        
        // Ensure analysisData is an array
        const analysisArray = Array.isArray(analysisData) ? analysisData : []
        
        setChannels(channelsData)
        setAnalysis(analysisArray)

        if (!selectedChannel && channelsData.length > 0) {
          setSelectedChannel(channelsData[0].id)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setAnalysis([]) // Set empty array on error
      } finally {
        setIsRefreshing(false)
      }
    }

    fetchData()
  }, [])

  const selectedChannelAnalysis = analysis.find(a => a.channelId === selectedChannel)

  const refreshAnalysis = async (channelId: string) => {
    try {
      setIsRefreshing(true)
      const response = await fetch('/api/analysis/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channelId }),
      })

      if (!response.ok) {
        throw new Error('Failed to refresh analysis')
      }

      const newAnalysis = await response.json()
      setAnalysis(prev => prev.map(a =>
        a.channelId === channelId ? { ...a, ...newAnalysis } : a
      ))
    } catch (error) {
      console.error('Error refreshing analysis:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r bg-white">
        <div className="h-14 border-b flex items-center px-4">
          <h1 className="text-lg font-semibold text-slate-900">Project Owl</h1>
        </div>
        <div className="p-2">
          <div className="space-y-0.5">
            {channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={cn(
                  "w-full px-2 py-1.5 text-sm rounded-md text-left flex items-center gap-2 transition-colors",
                  selectedChannel === channel.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <span className="text-slate-400">#</span>
                {channel.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
        {/* Header */}
        <header className="h-14 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {channels.find(c => c.id === selectedChannel)?.name ? 
                `#${channels.find(c => c.id === selectedChannel)?.name}` : 
                'Select a channel'}
            </h2>
            {selectedChannel && (
              <nav className="flex items-center gap-1">
                <Button
                  variant={view === 'recap' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('recap')}
                  className="text-sm"
                >
                  Daily Recap
                </Button>
                <Button
                  variant={view === 'tasks' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('tasks')}
                  className="text-sm"
                >
                  Tasks
                </Button>
                <Button
                  variant={view === 'risks' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('risks')}
                  className="text-sm"
                >
                  Risks
                </Button>
              </nav>
            )}
          </div>
          {selectedChannel && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => refreshAnalysis(selectedChannel)}
              disabled={isRefreshing}
              className="text-sm"
            >
              {isRefreshing ? (
                <>
                  <ReloadIcon className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <ReloadIcon className="mr-2 h-3.5 w-3.5" />
                  Refresh Analysis
                </>
              )}
            </Button>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {!selectedChannel ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-slate-900">Welcome to Project Owl</h3>
                <p className="text-slate-500">Select a channel to view its analysis</p>
              </div>
            </div>
          ) : !selectedChannelAnalysis ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-2">
                <Spinner className="h-8 w-8 animate-spin text-primary/40" />
                <p className="text-slate-500">Loading channel analysis...</p>
              </div>
            </div>
          ) : (
            <div className="px-6 py-6">
              {view === 'recap' && selectedChannelAnalysis?.highlights && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  {selectedChannelAnalysis.highlights.map((highlight) => (
                    <div key={highlight.date} className="bg-white rounded-lg p-6 shadow-sm border space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {new Date(highlight.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                      </div>
                      
                      <div className="prose prose-slate max-w-none">
                        <p>{highlight.summary}</p>
                      </div>

                      {highlight.decisions.length > 0 && (
                        <div>
                          <h4 className="font-medium text-slate-900 mb-2">Decisions Made</h4>
                          <ul className="list-disc pl-5 space-y-1 text-slate-700">
                            {highlight.decisions.map((decision, i) => (
                              <li key={i}>{decision}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {highlight.progress.length > 0 && (
                        <div>
                          <h4 className="font-medium text-slate-900 mb-2">Progress Updates</h4>
                          <ul className="list-disc pl-5 space-y-1 text-slate-700">
                            {highlight.progress.map((update, i) => (
                              <li key={i}>{update}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {highlight.questions.length > 0 && (
                        <div>
                          <h4 className="font-medium text-slate-900 mb-2">Open Questions</h4>
                          <ul className="list-disc pl-5 space-y-1 text-slate-700">
                            {highlight.questions.map((question, i) => (
                              <li key={i}>{question}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {highlight.actionItems.length > 0 && (
                        <div>
                          <h4 className="font-medium text-slate-900 mb-2">Action Items</h4>
                          <ul className="list-disc pl-5 space-y-1 text-slate-700">
                            {highlight.actionItems.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {view === 'tasks' && selectedChannelAnalysis?.actionItems && (
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold">Welcome back!</h2>
                      <p className="text-muted-foreground">Here's a list of your tasks for this month!</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          placeholder="Filter tasks..." 
                          className="px-3 py-1 text-sm border rounded-md"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-1 px-2 py-1 text-sm border rounded-md">
                          <span>Status</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button className="inline-flex items-center gap-1 px-2 py-1 text-sm border rounded-md">
                          <span>Priority</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button className="inline-flex items-center gap-1 px-2 py-1 text-sm border rounded-md">
                          <span>View</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-lg border shadow-sm">
                    <div className="p-4">
                      <table className="w-full">
                        <thead>
                          <tr className="text-sm text-muted-foreground">
                            <th className="w-[40px] text-left pl-2">
                              <input type="checkbox" className="rounded border-muted" />
                            </th>
                            <th className="font-medium text-left">Task</th>
                            <th className="w-[120px] font-medium text-left">Status</th>
                            <th className="w-[120px] font-medium text-left">Priority</th>
                            <th className="w-[40px]"></th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {Array.isArray(selectedChannelAnalysis.actionItems) 
                            ? selectedChannelAnalysis.actionItems.map((task, index) => (
                                <tr key={index} className="border-t hover:bg-muted/50">
                                  <td className="py-3 pl-2">
                                    <input type="checkbox" className="rounded border-muted" />
                                  </td>
                                  <td className="py-3">
                                    <div className="font-medium">{task.description}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {task.assignee} {task.dueDate && `• Due ${new Date(task.dueDate).toLocaleDateString()}`}
                                    </div>
                                  </td>
                                  <td className="py-3">
                                    <div className={cn(
                                      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                                      task.status === 'completed' ? "bg-green-100 text-green-800" :
                                        task.status === 'in_progress' ? "bg-blue-100 text-blue-800" :
                                          task.status === 'cancelled' ? "bg-gray-100 text-gray-800" :
                                            "bg-secondary text-secondary-foreground"
                                    )}>
                                      <span className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        task.status === 'completed' ? "bg-green-500" :
                                          task.status === 'in_progress' ? "bg-blue-500" :
                                            task.status === 'cancelled' ? "bg-gray-500" :
                                              "bg-secondary-foreground"
                                      )} />
                                      {task.status?.replace('_', ' ') || 'pending'}
                                    </div>
                                  </td>
                                  <td className="py-3">
                                    <div className="inline-flex items-center gap-1">
                                      <svg className={cn(
                                        "w-4 h-4",
                                        task.priority === 'high' ? "text-destructive rotate-180" :
                                          task.priority === 'low' ? "text-green-500" :
                                            "text-yellow-500"
                                      )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18" />
                                      </svg>
                                      <span className="text-sm">{task.priority}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 pr-4">
                                    <button className="p-1 hover:bg-muted rounded-md">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                      </svg>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            : null}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
                      <div className="text-muted-foreground">
                        0 of {selectedChannelAnalysis.actionItems?.length || 0} row(s) selected
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Rows per page</span>
                        <select className="px-1 py-0.5 border rounded text-sm">
                          <option>10</option>
                          <option>20</option>
                          <option>50</option>
                        </select>
                        <span className="text-muted-foreground">
                          Page 1 of {Math.ceil((selectedChannelAnalysis.actionItems?.length || 0) / 10)}
                        </span>
                        <div className="flex items-center">
                          <button className="p-1 hover:bg-muted rounded-md" disabled>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                          </button>
                          <button className="p-1 hover:bg-muted rounded-md" disabled>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button className="p-1 hover:bg-muted rounded-md">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <button className="p-1 hover:bg-muted rounded-md">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {view === 'risks' && selectedChannelAnalysis?.risks && (
                <div className="max-w-4xl mx-auto space-y-4">
                  {Array.isArray(selectedChannelAnalysis.risks)
                    ? selectedChannelAnalysis.risks.map((risk, index) => (
                        <div key={index} className="bg-card rounded-lg p-6 shadow-sm border hover:border-primary/50 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "w-1 h-full rounded-full flex-shrink-0",
                              risk.severity === 'high' ? "bg-destructive" :
                                risk.severity === 'medium' ? "bg-yellow-500" :
                                  "bg-green-500"
                            )} />
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium text-lg">{risk.description}</h4>
                                <div className="flex gap-2">
                                  <span className={cn(
                                    "px-2 py-1 rounded-full text-xs font-medium",
                                    risk.severity === 'high' ? "bg-red-100 text-red-800" :
                                      risk.severity === 'medium' ? "bg-yellow-100 text-yellow-800" :
                                        "bg-green-100 text-green-800"
                                  )}>
                                    {risk.severity}
                                  </span>
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {risk.type}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-3">
                                <h5 className="font-medium text-sm mb-1">Suggested Action</h5>
                                <p className="text-muted-foreground text-sm">{risk.suggestedAction}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    : null}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
