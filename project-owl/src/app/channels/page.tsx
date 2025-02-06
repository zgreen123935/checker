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
  const [analysis, setAnalysis] = useState<ChannelAnalysis[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [selectedChannelAnalysis, setSelectedChannelAnalysis] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [view, setView] = useState<'recap' | 'tasks' | 'risks'>('recap')
  const searchParams = useSearchParams()

  useEffect(() => {
    async function fetchData() {
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

  useEffect(() => {
    if (selectedChannel) {
      refreshAnalysis(selectedChannel)
    }
  }, [selectedChannel])

  const refreshAnalysis = async (channelId: string) => {
    try {
      setIsRefreshing(true)
      console.log('Refreshing analysis for channel:', channelId);
      const response = await fetch(`/api/analysis?channelId=${channelId}`)
      const data = await response.json()
      console.log('Analysis response:', data);
      setSelectedChannelAnalysis(data)
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

              {view === 'tasks' && selectedChannelAnalysis?.actionItems && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Action Items</h3>
                    {Array.isArray(selectedChannelAnalysis.actionItems) && selectedChannelAnalysis.actionItems.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-2 text-slate-700">
                        {selectedChannelAnalysis.actionItems.map((task, index) => (
                          <li key={index}>{task}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500">No action items found.</p>
                    )}
                  </div>
                </div>
              )}

              {view === 'risks' && selectedChannelAnalysis?.risks && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Risks & Concerns</h3>
                    {Array.isArray(selectedChannelAnalysis.risks) && selectedChannelAnalysis.risks.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-2 text-slate-700">
                        {selectedChannelAnalysis.risks.map((risk, index) => (
                          <li key={index}>{risk}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500">No risks found.</p>
                    )}
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
