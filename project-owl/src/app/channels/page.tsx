'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ReloadIcon, Spinner } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface ChannelSummary {
  id: string
  name: string
  purpose: string
  lastUpdated: Date
  analysisId: string | null
  error?: string
  messages: {
    ts: string
    text: string
    user?: string
    username?: string
    real_name?: string
    thread_ts?: string
    reply_count?: number
  }[]
}

interface ChannelAnalysis {
  id: string
  channelId: string
  summary: string | null
  decisions: string[]
  progress: string[]
  questions: string[]
  actionItems: string[]
  risks: string[]
  lastUpdated: Date
}

interface Highlight {
  date: string
  summary: string
  decisions: string[]
  progress: string[]
  questions: string[]
  actionItems: string[]
  risks: string[]
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
  const [selectedChannel, setSelectedChannel] = useState<ChannelSummary | null>(null)
  const [selectedChannelAnalysis, setSelectedChannelAnalysis] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [view, setView] = useState<'recap' | 'tasks' | 'risks'>('recap')
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchChannels()
  }, [])

  useEffect(() => {
    if (selectedChannel) {
      refreshAnalysis(selectedChannel.id)
    }
  }, [selectedChannel])

  const fetchChannels = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/channels')
      const data = await response.json()
      setChannels(data)
      
      // Only set initial channel if none is selected
      if (!selectedChannel && data.length > 0) {
        setSelectedChannel(data[0])
      }
    } catch (error) {
      console.error('Error fetching channels:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshAnalysis = async (channelId: string) => {
    try {
      setIsRefreshing(true)
      console.log('Refreshing analysis for channel:', channelId)
      const response = await fetch(`/api/analysis?channelId=${channelId}`)
      const data = await response.json()
      console.log('Analysis response:', data)
      console.log('Action items in response:', data.highlights?.map((h: any) => h.actionItems))
      setSelectedChannelAnalysis(data)
    } catch (error) {
      console.error('Error refreshing analysis:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const postOwlToChannel = async (channelId: string) => {
    try {
      const response = await fetch('/api/post-owl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channelId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to post owl emoji');
      }
      
      console.log('Successfully posted owl to channel:', channelId);
    } catch (error) {
      console.error('Error posting owl:', error);
    }
  };

  const postOwlToAllChannels = async () => {
    for (const channel of channels) {
      await postOwlToChannel(channel.id);
    }
  };

  const handleChannelClick = (channel: ChannelSummary) => {
    if (channel.id !== selectedChannel?.id) {
      setSelectedChannel(channel)
      setSelectedChannelAnalysis(null) // Clear previous analysis while loading new one
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r bg-white">
        <div className="h-14 border-b flex items-center px-4">
          <Image 
            src="/owl-icon.png" 
            alt="Project Owl" 
            width={24} 
            height={24} 
            className="mr-2"
          />
          <h1 className="text-lg font-semibold text-slate-900">Project Owl</h1>
        </div>
        <div className="p-2">
          <div className="space-y-0.5">
            {channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className={cn(
                  "w-full px-2 py-1.5 text-sm rounded-md text-left flex items-center gap-2 transition-colors",
                  selectedChannel === channel
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
              {selectedChannel?.name ? 
                `#${selectedChannel.name}` : 
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
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => refreshAnalysis(selectedChannel.id)}
                disabled={isRefreshing}
                className="text-sm"
              >
                {isRefreshing ? (
                  <>
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <ReloadIcon className="mr-2 h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={postOwlToAllChannels}
                className="text-sm"
              >
                🦉 Post Owl
              </Button>
            </div>
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
              {view === 'recap' && selectedChannelAnalysis?.highlights ? (
                <div className="space-y-6 max-w-4xl mx-auto">
                  {console.log('Rendering highlights:', selectedChannelAnalysis.highlights)}
                  {selectedChannelAnalysis.highlights.map((highlight: Highlight) => (
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

                      {highlight.risks.length > 0 && (
                        <div>
                          <h4 className="font-medium text-slate-900 mb-2">Risks & Concerns</h4>
                          <ul className="list-disc pl-5 space-y-1 text-slate-700">
                            {highlight.risks.map((risk, i) => (
                              <li key={i}>{risk}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}

              {view === 'tasks' && selectedChannelAnalysis?.highlights && (
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-slate-900">Action Items</h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">Status</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">Priority</span>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Task
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Priority
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedChannelAnalysis.highlights.flatMap((highlight, highlightIndex) => 
                            highlight.actionItems?.map((task, taskIndex) => (
                              <tr key={`${highlightIndex}-${taskIndex}`} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-normal">
                                  <div className="text-sm text-gray-900">{task}</div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(highlight.date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    Todo
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                    Medium
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button className="text-gray-400 hover:text-gray-500">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            )) ?? []
                          )}
                        </tbody>
                      </table>
                      
                      {!selectedChannelAnalysis.highlights.some(h => h.actionItems?.length > 0) && (
                        <div className="text-center py-8">
                          <p className="text-slate-500">No action items found.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {view === 'risks' && selectedChannelAnalysis?.highlights && (
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-slate-900">Risk Register</h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">Status</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">Impact</span>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Risk
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Impact
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedChannelAnalysis.highlights.flatMap((highlight, highlightIndex) => 
                            highlight.risks?.map((risk, riskIndex) => (
                              <tr key={`${highlightIndex}-${riskIndex}`} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-normal">
                                  <div className="text-sm text-gray-900">{risk}</div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(highlight.date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                    Active
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                    High
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button className="text-gray-400 hover:text-gray-500">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            )) ?? []
                          )}
                        </tbody>
                      </table>
                      
                      {!selectedChannelAnalysis.highlights.some(h => h.risks?.length > 0) && (
                        <div className="text-center py-8">
                          <p className="text-slate-500">No risks found.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
