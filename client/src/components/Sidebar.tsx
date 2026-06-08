import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { FileText, Plus, ArrowLeft, ChevronDown, ChevronRight, Settings, Box, Zap, PencilRuler, Ruler, Microscope, GripHorizontal, Filter, Lock, Users, Cpu, TestTube } from 'lucide-react'
import { apiService } from '../services/apiService'

interface SidebarExpandedSections {
  capabilities: boolean
  enablers: boolean
}

interface ExpandedComponentGroups {
  [groupKey: string]: boolean
}

interface Capability {
  id?: string
  title?: string
  name?: string
  path: string
  system?: string
  component?: string
  status?: string
  approval?: string
}

interface Enabler {
  id?: string
  title?: string
  name?: string
  path: string
  capabilityId?: string
  status?: string
  approval?: string
}

interface SelectedDocument {
  type: 'capability' | 'enabler'
  path: string
  id: string
}

interface Requirement {
  id: string
  name: string
  type: 'Functional' | 'Non-Functional'
  enablerID: string
  enablerName: string
}

export default function Sidebar(): JSX.Element {
  const {
    capabilities,
    enablers,
    customerRequirements,
    systemRequirements,
    testCases,
    selectedCapability,
    setSelectedCapability,
    selectedDocument,
    setSelectedDocument,
    navigationHistory,
    goBack,
    clearHistory,
    loading,
    searchTerm,
    searchResults,
    activeWorkspaceId
  } = useApp()

  const [expandedSections, setExpandedSections] = useState<SidebarExpandedSections>({
    capabilities: true,
    enablers: true
  })
  const [crExpanded, setCrExpanded] = useState<boolean>(true)
  const [srExpanded, setSrExpanded] = useState<boolean>(true)
  const [tcExpanded, setTcExpanded] = useState<boolean>(true)

  const [expandedComponentGroups, setExpandedComponentGroups] = useState<ExpandedComponentGroups>({})

  // Track workspace changes to collapse navigation when switching workspaces
  const [previousWorkspaceId, setPreviousWorkspaceId] = useState<string | null>(null)

  // Enabler filtering toggle state
  const [filterEnablersByCapability, setFilterEnablersByCapability] = useState<boolean>(true)

  // Project NFRs section state
  const [projectNfrCount, setProjectNfrCount] = useState<number>(0)
  const [projectNfrsExpanded, setProjectNfrsExpanded] = useState<boolean>(true)

  // Resizable sections state
  const [capabilitiesHeight, setCapabilitiesHeight] = useState<number>(50) // Percentage
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const navigate = useNavigate()

  const toggleSection = (section: keyof SidebarExpandedSections): void => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const toggleComponentGroup = (groupKey: string): void => {
    setExpandedComponentGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }))
  }

  const handleCapabilityClick = (capability: Capability): void => {
    setSelectedCapability(capability)
    setSelectedDocument({
      type: 'capability',
      path: capability.path,
      id: capability.id || capability.title || capability.path
    })
    clearHistory()
    navigate(`/view/capability/${capability.path}`)
  }

  const handleEnablerClick = (enabler: Enabler): void => {
    setSelectedDocument({
      type: 'enabler',
      path: enabler.path,
      id: enabler.id || enabler.title || enabler.path
    })
    navigate(`/view/enabler/${enabler.path}`)
  }

  const handleRequirementClick = (requirement: Requirement): void => {
    // Find the enabler that contains this requirement
    const enabler = enablers.find(e => e.id === requirement.enablerID)
    if (enabler) {
      setSelectedDocument({
        type: 'enabler',
        path: enabler.path,
        id: enabler.id || enabler.title || enabler.path
      })
      navigate(`/view/enabler/${enabler.path}`)
    }
  }

  const handleCreateCapability = (): void => {
    setSelectedDocument(null)
    navigate('/create/capability')
  }

  const handleCreateEnabler = (): void => {
    setSelectedDocument(null)
    navigate('/create/enabler')
  }

  const handleBackClick = (): void => {
    goBack()
  }

  const filteredEnablers = (selectedCapability && filterEnablersByCapability)
    ? enablers.filter(enabler => enabler.capabilityId === selectedCapability.id)
    : enablers

  const groupCapabilitiesBySystemComponent = (capabilitiesList: Capability[]): Record<string, Capability[]> => {
    const groups: Record<string, Capability[]> = {}

    capabilitiesList.forEach(capability => {
      const system = capability.system?.trim()
      const component = capability.component?.trim()

      if (system && component) {
        const groupKey = `${system} | ${component}`

        if (!groups[groupKey]) {
          groups[groupKey] = []
        }
        groups[groupKey].push(capability)
      } else {
        if (!groups['Unassigned']) {
          groups['Unassigned'] = []
        }
        groups['Unassigned'].push(capability)
      }
    })

    return groups
  }

  const capabilityGroups = useMemo(() => groupCapabilitiesBySystemComponent(capabilities), [capabilities])

  // Load project NFR count, reload on workspace change
  useEffect(() => {
    apiService.getProjectNfrs().then(rows => setProjectNfrCount(rows.length)).catch(() => setProjectNfrCount(0))
  }, [activeWorkspaceId])

  // Detect workspace changes and reset expansion states
  useEffect(() => {
    if (previousWorkspaceId !== null && previousWorkspaceId !== activeWorkspaceId) {
      // Workspace has changed, collapse all sections
      console.log('Workspace change detected, collapsing all sections')
      setExpandedSections({
        capabilities: false,
        enablers: false
      })
      setExpandedComponentGroups({})
    }

    setPreviousWorkspaceId(activeWorkspaceId)
  }, [activeWorkspaceId, previousWorkspaceId])

  // Initialize expanded state for new component groups (closed by default)
  useEffect(() => {
    setExpandedComponentGroups(prev => {
      const newState = { ...prev }
      Object.keys(capabilityGroups).forEach(groupKey => {
        if (!(groupKey in newState)) {
          newState[groupKey] = false // Closed by default
        }
      })
      return newState
    })
  }, [capabilityGroups])

  const getAssociatedCapabilityId = (): string | null => {
    if (selectedDocument?.type === 'enabler') {
      const selectedEnabler = enablers.find(enabler => enabler.path === selectedDocument.path)
      return selectedEnabler?.capabilityId || null
    }
    return null
  }

  const associatedCapabilityId = getAssociatedCapabilityId()

  // Handle resizer drag functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !sidebarRef.current) return

    const rect = sidebarRef.current.getBoundingClientRect()
    const totalHeight = rect.height - 120 // Account for header and padding
    const relativeY = e.clientY - rect.top - 60 // Account for header
    const percentage = Math.max(20, Math.min(80, (relativeY / totalHeight) * 100))

    setCapabilitiesHeight(percentage)
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'ns-resize'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  if (loading) {
    return (
      <div className="bg-card text-foreground rounded-[10px] p-6 shadow-md overflow-y-auto max-h-[calc(100vh-120px)]">
        <div className="flex items-center justify-center p-8 text-primary">
          <div className="spinner"></div>
          Loading...
        </div>
      </div>
    )
  }

  // Show search results if there's a search term
  if (searchTerm.trim()) {
    return (
      <div className="bg-card text-foreground rounded-[10px] p-6 shadow-md overflow-y-auto max-h-[calc(100vh-120px)]">
        {navigationHistory.length > 0 && (
          <button onClick={handleBackClick} className="flex items-center gap-2 py-2 px-4 mb-4 bg-card/70 border border-border rounded cursor-pointer text-sm text-primary w-full transition-all duration-150 ease-in-out backdrop-blur-[1px] hover:bg-accent hover:text-primary/80 hover:backdrop-blur-[2px]">
            <ArrowLeft size={16} />
            Back
          </button>
        )}

        <div className="mb-6">
          <h4 className="text-lg font-semibold text-foreground border-b-2 border-primary pb-2 mb-4">
            Search Results for "{searchTerm}"
          </h4>

          {searchResults.capabilities.length > 0 && (
            <div className="mb-6">
              <h5 className="text-md font-medium text-foreground mb-3 flex items-center gap-2">
                <Box size={16} />
                Capabilities ({searchResults.capabilities.length})
              </h5>
              <div className="ml-4 border-l-2 border-primary/20 pl-2 space-y-1">
                {searchResults.capabilities.map((capability) => {
                  const isActive = selectedDocument?.type === 'capability' && selectedDocument?.path === capability.path
                  const isImplemented = capability.status === 'Implemented'
                  return (
                    <div
                      key={`${capability.path}-${capability.status}-${capability.approval}`}
                      className={`flex items-center gap-3 py-2 px-3 rounded-md cursor-pointer transition-all duration-150 ease-in-out text-sm ${capability.approval === 'Not Approved' ? 'text-gray-400' : 'text-foreground'} ${
                        isActive
                          ? 'bg-primary/80 text-primary-foreground backdrop-blur-sm'
                          : 'hover:bg-accent hover:text-accent-foreground hover:backdrop-blur-sm'
                      } relative`}
                      onClick={() => handleCapabilityClick(capability)}
                    >
                      <Zap size={16} className={isImplemented ? 'text-yellow-500 fill-yellow-500' : ''} />
                      <span className="flex-1 break-words">{capability.title || capability.name}</span>
                      {capability.id && <small className="text-xs opacity-70">({capability.id})</small>}
                      {capability.status === 'In Analysis' && (
                        <Microscope size={19} className="text-blue-500 ml-1" />
                      )}
                      {capability.status === 'In Design' && (
                        <Ruler size={19} className="text-blue-500 ml-1" />
                      )}
                      {capability.status === 'In Implementation' && (
                        <img src="/anvil.png" style={{width: '29px', height: '29px'}} className="ml-1" alt="Implementation" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {searchResults.enablers.length > 0 && (
            <div className="mb-6">
              <h5 className="text-md font-medium text-foreground mb-3 flex items-center gap-2">
                <Zap size={16} />
                Enablers ({searchResults.enablers.length})
              </h5>
              <div className="ml-4 border-l-2 border-primary/20 pl-2 space-y-1">
                {searchResults.enablers.map((enabler) => {
                  const isActive = selectedDocument?.type === 'enabler' && selectedDocument?.path === enabler.path
                  const isImplemented = enabler.status === 'Implemented'
                  return (
                    <div
                      key={`${enabler.path}-${enabler.status}-${enabler.approval}`}
                      className={`flex items-center gap-3 py-2 px-3 rounded-md cursor-pointer transition-all duration-150 ease-in-out text-sm ${enabler.approval === 'Not Approved' ? 'text-gray-400' : 'text-foreground'} ${
                        isActive
                          ? 'bg-primary/80 text-primary-foreground backdrop-blur-sm'
                          : 'hover:bg-accent hover:text-accent-foreground hover:backdrop-blur-sm'
                      } relative`}
                      onClick={() => handleEnablerClick(enabler)}
                    >
                      <Zap size={16} className={isImplemented ? 'text-yellow-500 fill-yellow-500' : ''} />
                      <span className="flex-1 break-words">{enabler.title || enabler.name}</span>
                      {enabler.id && <small className="text-xs opacity-70">({enabler.id})</small>}
                      {enabler.status === 'In Analysis' && (
                        <Microscope size={19} className="text-blue-500 ml-1" />
                      )}
                      {enabler.status === 'In Design' && (
                        <Ruler size={19} className="text-blue-500 ml-1" />
                      )}
                      {enabler.status === 'In Implementation' && (
                        <img src="/anvil.png" style={{width: '29px', height: '29px'}} className="ml-1" alt="Implementation" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {searchResults.requirements.length > 0 && (
            <div className="mb-6">
              <h5 className="text-md font-medium text-foreground mb-3 flex items-center gap-2">
                <FileText size={16} />
                Requirements ({searchResults.requirements.length})
              </h5>
              <div className="ml-4 border-l-2 border-primary/20 pl-2 space-y-1">
                {searchResults.requirements.map((requirement, index) => (
                  <div
                    key={`${requirement.enablerID}-${requirement.id}-${index}`}
                    className="flex items-start gap-3 py-2 px-3 rounded-md cursor-pointer transition-all duration-150 ease-in-out text-foreground text-sm hover:bg-accent hover:text-accent-foreground hover:backdrop-blur-sm"
                    onClick={() => handleRequirementClick(requirement)}
                  >
                    <FileText size={16} className="mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="block font-medium">{requirement.name || requirement.id}</span>
                      <small className="text-xs text-muted-foreground">
                        {requirement.type} • in {requirement.enablerName}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.capabilities.length === 0 &&
           searchResults.enablers.length === 0 &&
           searchResults.requirements.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No results found for "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div ref={sidebarRef} className="bg-card text-foreground rounded-[10px] p-6 shadow-md flex flex-col max-h-[calc(100vh-120px)]">
      {navigationHistory.length > 0 && (
        <button onClick={handleBackClick} className="flex items-center gap-2 py-2 px-4 mb-4 bg-card/70 border border-border rounded cursor-pointer text-sm text-primary w-full transition-all duration-150 ease-in-out backdrop-blur-[1px] hover:bg-accent hover:text-primary/80 hover:backdrop-blur-[2px]">
          <ArrowLeft size={16} />
          Back
        </button>
      )}

      {/* Customer Requirements Section */}
      <div className="flex flex-col min-h-0 mb-1">
        <div
          className="flex items-center gap-2 py-3 font-semibold text-xl text-foreground cursor-pointer border-b-2 border-primary mb-3 justify-between uppercase tracking-wide hover:text-foreground/90 bg-card sticky top-0 z-10"
          onClick={() => setCrExpanded(prev => !prev)}
        >
          {crExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Users size={14} className="text-muted-foreground" />
          <span className="flex-1 ml-1">Customer Requirements</span>
          <button
            onClick={e => { e.stopPropagation(); navigate('/create/customer-requirement') }}
            className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors duration-200 shadow-sm border border-primary/20"
            title="Create Customer Requirement"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
        {crExpanded && (
          <div className="ml-4 border-l-2 border-primary/20 pl-2 space-y-1 max-h-40 overflow-y-auto">
            {customerRequirements.length === 0 ? (
              <div className="text-xs text-muted-foreground py-2 px-3">No customer requirements</div>
            ) : (
              customerRequirements.map(cr => (
                <div
                  key={(cr as any).path}
                  className="flex items-center gap-3 py-2 px-3 rounded-md cursor-pointer transition-all duration-150 ease-in-out text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={() => navigate(`/view/customer-requirement/${(cr as any).path}`)}
                >
                  <Users size={14} className="text-muted-foreground shrink-0" />
                  <span className="flex-1 break-words">{(cr as any).name || (cr as any).id}</span>
                  {(cr as any).id && <small className="text-xs opacity-60">{(cr as any).id}</small>}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* System Requirements Section */}
      <div className="flex flex-col min-h-0 mb-1">
        <div
          className="flex items-center gap-2 py-3 font-semibold text-xl text-foreground cursor-pointer border-b-2 border-primary mb-3 justify-between uppercase tracking-wide hover:text-foreground/90 bg-card sticky top-0 z-10"
          onClick={() => setSrExpanded(prev => !prev)}
        >
          {srExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Cpu size={14} className="text-muted-foreground" />
          <span className="flex-1 ml-1">System Requirements</span>
          <button
            onClick={e => { e.stopPropagation(); navigate('/create/system-requirement') }}
            className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors duration-200 shadow-sm border border-primary/20"
            title="Create System Requirement"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
        {srExpanded && (
          <div className="ml-4 border-l-2 border-primary/20 pl-2 space-y-1 max-h-40 overflow-y-auto">
            {systemRequirements.length === 0 ? (
              <div className="text-xs text-muted-foreground py-2 px-3">No system requirements</div>
            ) : (
              systemRequirements.map(sr => (
                <div
                  key={(sr as any).path}
                  className="flex items-center gap-3 py-2 px-3 rounded-md cursor-pointer transition-all duration-150 ease-in-out text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={() => navigate(`/view/system-requirement/${(sr as any).path}`)}
                >
                  <Cpu size={14} className="text-muted-foreground shrink-0" />
                  <span className="flex-1 break-words">{(sr as any).name || (sr as any).id}</span>
                  {(sr as any).id && <small className="text-xs opacity-60">{(sr as any).id}</small>}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div
        className="flex flex-col"
        style={{ height: `${capabilitiesHeight}%` }}
      >
        {/* Sticky Capabilities Header */}
        <div
          className="flex items-center gap-2 py-3 font-semibold text-xl text-foreground cursor-pointer border-b-2 border-primary mb-3 justify-between uppercase tracking-wide hover:text-foreground/90 bg-card sticky top-0 z-10"
          onClick={(): void => toggleSection('capabilities')}
        >
          {expandedSections.capabilities ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="flex-1 ml-2">Capabilities</span>
          <button
            onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
              e.stopPropagation()
              handleCreateCapability()
            }}
            className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors duration-200 shadow-sm border border-primary/20"
            title="Create New Capability"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Capabilities Content */}
        {expandedSections.capabilities && (
          <div className="overflow-y-auto flex-1">
          <div className="flex flex-col gap-1">
            {Object.entries(capabilityGroups)
              .sort(([a], [b]) => {
                if (a === 'Unassigned') return 1
                if (b === 'Unassigned') return -1
                return a.localeCompare(b)
              })
              .map(([groupKey, groupCapabilities]) => {
                // Check if all capabilities in this group are implemented
                const allImplemented = groupCapabilities.length > 0 && groupCapabilities.every(cap => cap.status === 'Implemented')

                // Blue icon when all capabilities in group are implemented

                return (
                <div key={groupKey} className="mb-4">
                  <div
                    className="flex items-center gap-3 py-3 px-3 rounded-md transition-all duration-150 ease-in-out text-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    onClick={() => toggleComponentGroup(groupKey)}
                  >
                    {expandedComponentGroups[groupKey] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <Box size={16} className={allImplemented ? 'text-blue-400 fill-blue-400 stroke-black stroke-1' : ''} />
                    <span>{groupKey}</span>
                  </div>
                  {expandedComponentGroups[groupKey] && (
                    <div className="ml-4 border-l-2 border-primary/20 pl-2">
                    {groupCapabilities
                      .sort((a, b) => {
                        const nameA = (a.title || a.name || '').toLowerCase()
                        const nameB = (b.title || b.name || '').toLowerCase()
                        return nameA.localeCompare(nameB)
                      })
                      .map((capability) => {
                        const isActive = selectedDocument?.type === 'capability' && selectedDocument?.path === capability.path
                        const isAssociated = !!associatedCapabilityId && capability.id === associatedCapabilityId
                        const isImplemented = capability.status === 'Implemented'

                        return (
                          <div
                            key={`${capability.path}-${capability.status}-${capability.approval}`}
                            className={`flex items-center gap-3 py-3 px-3 rounded-md cursor-pointer transition-all duration-150 ease-in-out mb-1 text-sm ${capability.approval === 'Not Approved' ? 'text-gray-400' : 'text-foreground'} ${
                              isActive
                                ? 'bg-primary/80 text-primary-foreground backdrop-blur-sm'
                                : isAssociated
                                ? 'bg-transparent border-2 border-primary/80 rounded-lg text-primary font-medium'
                                : 'hover:bg-accent hover:text-accent-foreground hover:backdrop-blur-sm'
                            } relative`}
                            onClick={(): void => handleCapabilityClick(capability)}
                          >
                            <Zap size={16} className={isImplemented ? 'text-yellow-500 fill-yellow-500' : ''} />
                            <span className="flex-1 break-words">{capability.title || capability.name}</span>
                            {capability.status === 'In Analysis' && (
                              <Microscope size={19} className="text-blue-500 ml-1" />
                            )}
                            {capability.status === 'In Design' && (
                              <Ruler size={19} className="text-blue-500 ml-1" />
                            )}
                            {capability.status === 'In Implementation' && (
                              <img src="/anvil.png" style={{width: '29px', height: '29px'}} className="ml-1" alt="Implementation" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                )
              })}
          </div>
          </div>
        )}
      </div>

      {/* Resizable separator */}
      <div
        className={`flex items-center justify-center h-3 cursor-ns-resize select-none transition-colors duration-200 ${
          isDragging ? 'bg-primary/20' : 'hover:bg-primary/10'
        }`}
        onMouseDown={handleMouseDown}
      >
        <GripHorizontal
          size={16}
          className={`text-muted-foreground transition-colors duration-200 ${
            isDragging ? 'text-primary' : 'hover:text-primary'
          }`}
        />
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        {/* Sticky Enablers Header */}
        <div
          className="flex items-center gap-2 py-3 font-semibold text-xl text-foreground cursor-pointer border-b-2 border-primary mb-3 justify-between uppercase tracking-wide hover:text-foreground/90 bg-card sticky top-0 z-10"
          onClick={(): void => toggleSection('enablers')}
        >
          {expandedSections.enablers ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="flex-1 ml-2">Enablers</span>
          <button
            onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
              e.stopPropagation()
              setFilterEnablersByCapability(!filterEnablersByCapability)
            }}
            className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-200 shadow-sm border ${
              filterEnablersByCapability
                ? 'bg-primary text-primary-foreground border-primary/20 hover:bg-primary/90'
                : 'bg-secondary text-secondary-foreground border-secondary/20 hover:bg-secondary/90'
            }`}
            title={filterEnablersByCapability ? "Show All Enablers" : "Filter by Selected Capability"}
          >
            <Filter size={16} strokeWidth={2.5} />
          </button>
          <button
            onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
              e.stopPropagation()
              handleCreateEnabler()
            }}
            className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors duration-200 shadow-sm border border-primary/20"
            title="Create New Enabler"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Enablers Content */}
        {expandedSections.enablers && (
          <div className="overflow-y-auto flex-1">
          <div className="ml-4 border-l-2 border-primary/20 pl-2">
            {filteredEnablers
              .sort((a, b) => {
                const nameA = (a.title || a.name || '').toLowerCase()
                const nameB = (b.title || b.name || '').toLowerCase()
                return nameA.localeCompare(nameB)
              })
              .map((enabler) => {
                const isActive = selectedDocument?.type === 'enabler' && selectedDocument?.path === enabler.path
                const isImplemented = enabler.status === 'Implemented'

                return (
                  <div
                    key={enabler.path}
                    className={`flex items-center gap-3 py-3 px-3 rounded-md cursor-pointer transition-all duration-150 ease-in-out mb-1 text-sm ${enabler.approval === 'Not Approved' ? 'text-gray-400' : 'text-foreground'} ${
                      isActive
                        ? 'bg-primary/80 text-primary-foreground backdrop-blur-sm'
                        : 'hover:bg-accent hover:text-accent-foreground hover:backdrop-blur-sm'
                    } ${isImplemented ? 'relative' : ''}`}
                    onClick={(): void => handleEnablerClick(enabler)}
                  >
                    <Zap size={16} className={isImplemented ? 'text-yellow-500 fill-yellow-500' : ''} />
                    <span className="flex-1 break-words">{enabler.title || enabler.name}</span>
                    {enabler.status === 'In Analysis' && (
                      <Microscope size={19} className="text-blue-500 ml-1" />
                    )}
                    {enabler.status === 'In Design' && (
                      <Ruler size={19} className="text-blue-500 ml-1" />
                    )}
                    {enabler.status === 'In Implementation' && (
                      <img src="/anvil.png" style={{width: '29px', height: '29px'}} className="ml-1" alt="Implementation" />
                    )}
                  </div>
                )
              })}
          </div>
          </div>
        )}
      </div>
      {/* Test Cases Section */}
      <div className="flex flex-col min-h-0">
        <div
          className="flex items-center gap-2 py-3 font-semibold text-xl text-foreground cursor-pointer border-b-2 border-primary mb-3 justify-between uppercase tracking-wide hover:text-foreground/90 bg-card sticky top-0 z-10"
          onClick={() => setTcExpanded(prev => !prev)}
        >
          {tcExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <TestTube size={14} className="text-muted-foreground" />
          <span className="flex-1 ml-1">Test Cases</span>
          <button
            onClick={e => { e.stopPropagation(); navigate('/create/test-case') }}
            className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors duration-200 shadow-sm border border-primary/20"
            title="Create Test Case"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
        {tcExpanded && (
          <div className="ml-4 border-l-2 border-primary/20 pl-2 space-y-1 max-h-40 overflow-y-auto">
            {testCases.length === 0 ? (
              <div className="text-xs text-muted-foreground py-2 px-3">No test cases</div>
            ) : (
              testCases.map(tc => {
                const passFailColor = {
                  'Pass': 'text-green-500',
                  'Fail': 'text-red-500',
                  'Blocked': 'text-yellow-500'
                }[(tc as any).passFail] || ''
                return (
                  <div
                    key={(tc as any).path}
                    className="flex items-center gap-3 py-2 px-3 rounded-md cursor-pointer transition-all duration-150 ease-in-out text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={() => navigate(`/view/test-case/${(tc as any).path}`)}
                  >
                    <TestTube size={14} className={`shrink-0 ${passFailColor || 'text-muted-foreground'}`} />
                    <span className="flex-1 break-words">{(tc as any).name || (tc as any).id}</span>
                    {(tc as any).id && <small className="text-xs opacity-60">{(tc as any).id}</small>}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Project NFRs Section */}
      <div className="flex flex-col min-h-0">
        <div
          className="flex items-center gap-2 py-3 font-semibold text-xl text-foreground cursor-pointer border-b-2 border-primary mb-3 justify-between uppercase tracking-wide hover:text-foreground/90 bg-card sticky top-0 z-10"
          onClick={() => setProjectNfrsExpanded(prev => !prev)}
        >
          {projectNfrsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Lock size={14} className="text-muted-foreground" />
          <span className="flex-1 ml-1">Project NFRs</span>
          {projectNfrCount > 0 && (
            <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {projectNfrCount}
            </span>
          )}
        </div>

        {projectNfrsExpanded && (
          <div className="pl-2">
            <button
              onClick={() => navigate('/project-nfrs')}
              className="w-full flex items-center gap-3 py-2 px-3 rounded-md text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-150 ease-in-out"
            >
              <Lock size={14} className="text-muted-foreground shrink-0" />
              <span className="flex-1 text-left">
                {projectNfrCount === 0 ? 'No project NFRs defined' : `${projectNfrCount} requirement${projectNfrCount === 1 ? '' : 's'}`}
              </span>
              <span className="text-xs text-muted-foreground">Manage →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
