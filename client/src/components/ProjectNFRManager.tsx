import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Save, Edit3, Lock } from 'lucide-react'
import { apiService } from '../services/apiService'
import { generateNonFunctionalRequirementId } from '../utils/idGenerator'
import { STATUS_VALUES, APPROVAL_VALUES, PRIORITY_VALUES } from '../utils/constants'
import { useApp } from '../contexts/AppContext'
import { websocketService } from '../services/websocketService'
import toast from 'react-hot-toast'

interface NfrRow {
  id: string
  name: string
  requirement: string
  type: string
  status: string
  priority: string
  approval: string
}

const NFR_TYPES = [
  'Correctness', 'Maintainability', 'Performance', 'Reliability', 'Scalability', 'Security', 'Usability'
]

// ── Bulk Edit Panel ──────────────────────────────────────────────────────────

interface BulkEditPanelProps {
  rows: NfrRow[]
  selectedIndices: Set<number>
  onSelectAll: () => void
  onSelectNone: () => void
  onBulkApply: (updates: Partial<NfrRow>) => void
}

function BulkEditPanel({ rows, selectedIndices, onSelectAll, onSelectNone, onBulkApply }: BulkEditPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkPriority, setBulkPriority] = useState('')
  const [bulkApproval, setBulkApproval] = useState('')

  if (rows.length === 0) return null

  const canApply = (bulkStatus || bulkPriority || bulkApproval) && selectedIndices.size > 0

  const handleApply = () => {
    const updates: Partial<NfrRow> = {}
    if (bulkStatus) updates.status = bulkStatus
    if (bulkPriority) updates.priority = bulkPriority
    if (bulkApproval) updates.approval = bulkApproval
    if (Object.keys(updates).length > 0) {
      onBulkApply(updates)
      setBulkStatus('')
      setBulkPriority('')
      setBulkApproval('')
      setExpanded(false)
    }
  }

  return (
    <div className="mb-4 border border-border rounded-md">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 bg-accent text-foreground rounded-t-md hover:bg-accent/80 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Edit3 size={16} />
          <span className="font-medium">Bulk Edit Non-Functional Requirements</span>
          <span className="text-sm text-muted-foreground">({selectedIndices.size} of {rows.length} selected)</span>
        </div>
        <span className="text-sm">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="p-4 bg-card border-t border-border space-y-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Leave fields empty to skip updating them.</p>
            <div className="flex gap-2">
              <button type="button" onClick={onSelectAll} className="px-3 py-1 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors text-sm">Select All</button>
              <button type="button" onClick={onSelectNone} className="px-3 py-1 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors text-sm">Select None</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Priority</label>
              <select className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm" value={bulkPriority} onChange={e => setBulkPriority(e.target.value)}>
                <option value="">Select priority...</option>
                {Object.values(PRIORITY_VALUES.REQUIREMENT).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Status</label>
              <select className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm" value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
                <option value="">Select status...</option>
                {Object.values(STATUS_VALUES.REQUIREMENT).sort().map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Approval</label>
              <select className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm" value={bulkApproval} onChange={e => setBulkApproval(e.target.value)}>
                <option value="">Select approval...</option>
                {Object.values(APPROVAL_VALUES).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={handleApply} disabled={!canApply} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Apply to {selectedIndices.size} Selected
            </button>
            <button type="button" onClick={() => { setBulkStatus(''); setBulkPriority(''); setBulkApproval('') }} className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors">Clear</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ProjectNFRManager(): JSX.Element {
  const { activeWorkspaceId } = useApp()
  const [rows, setRows] = useState<NfrRow[]>([])
  const [savedRows, setSavedRows] = useState<NfrRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const isDirty = JSON.stringify(rows) !== JSON.stringify(savedRows)

  const loadNfrs = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiService.getProjectNfrs()
      setRows(data)
      setSavedRows(data)
    } catch (err) {
      toast.error('Failed to load project NFRs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadNfrs() }, [loadNfrs])

  // Reload when workspace changes
  const prevWorkspaceRef = useRef(activeWorkspaceId)
  useEffect(() => {
    if (prevWorkspaceRef.current !== null && prevWorkspaceRef.current !== activeWorkspaceId) {
      loadNfrs()
    }
    prevWorkspaceRef.current = activeWorkspaceId
  }, [activeWorkspaceId, loadNfrs])

  // Real-time reload when project-nfrs.md changes externally and there are no unsaved edits
  useEffect(() => {
    const removeListener = websocketService.addListener((data: any) => {
      if (data.type === 'file-change' && (data.filePath || '').toLowerCase().endsWith('project-nfrs.md') && !isDirty) {
        loadNfrs()
      }
    })
    return removeListener
  }, [isDirty, loadNfrs])

  // Unsaved changes guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const handleSave = async () => {
    try {
      setSaving(true)
      await apiService.saveProjectNfrs(rows)
      setSavedRows([...rows])
      toast.success('Project NFRs saved')
    } catch (err) {
      toast.error('Failed to save project NFRs')
    } finally {
      setSaving(false)
    }
  }

  const addRow = () => {
    const existingIds = rows.map(r => r.id).filter(id => id.startsWith('NFR-'))
    const newRow: NfrRow = {
      id: generateNonFunctionalRequirementId(existingIds),
      name: '',
      requirement: '',
      type: '',
      status: STATUS_VALUES.REQUIREMENT.IN_DRAFT,
      priority: PRIORITY_VALUES.REQUIREMENT.MUST_HAVE,
      approval: APPROVAL_VALUES.NOT_APPROVED
    }
    setRows(prev => [...prev, newRow])
  }

  const updateRow = (index: number, field: keyof NfrRow, value: string) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  const deleteRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index))
    setSelectedIndices(prev => {
      const next = new Set<number>()
      prev.forEach(i => { if (i < index) next.add(i); else if (i > index) next.add(i - 1) })
      return next
    })
  }

  const moveRow = (index: number, direction: 'top' | 'bottom') => {
    setRows(prev => {
      const next = [...prev]
      const target = direction === 'top' ? 0 : next.length - 1
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  const bulkApply = (updates: Partial<NfrRow>) => {
    setRows(prev => prev.map((r, i) => selectedIndices.has(i) ? { ...r, ...updates } : r))
    setSelectedIndices(new Set())
  }

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) return
    setRows(prev => {
      const next = [...prev]
      const [item] = next.splice(draggedIndex, 1)
      next.splice(targetIndex, 0, item)
      return next
    })
    setDraggedIndex(null)
  }
  const handleDragEnd = () => setDraggedIndex(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-primary">
        <div className="spinner mr-2" />Loading project NFRs...
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock size={20} className="text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Project Non-Functional Requirements</h2>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && <span className="text-sm text-amber-500 font-medium">Unsaved changes</span>}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        These requirements apply to the entire workspace. They are shown read-only on each Enabler form.
      </p>

      {/* Bulk edit */}
      <BulkEditPanel
        rows={rows}
        selectedIndices={selectedIndices}
        onSelectAll={() => setSelectedIndices(new Set(rows.map((_, i) => i)))}
        onSelectNone={() => setSelectedIndices(new Set())}
        onBulkApply={bulkApply}
      />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 text-sm font-medium text-foreground w-8">
                <input
                  type="checkbox"
                  checked={selectedIndices.size === rows.length && rows.length > 0}
                  onChange={e => setSelectedIndices(e.target.checked ? new Set(rows.map((_, i) => i)) : new Set())}
                  className="rounded"
                />
              </th>
              <th className="text-left p-2 text-sm font-medium text-foreground w-8"></th>
              <th className="text-left p-2 text-sm font-medium text-foreground w-36">ID</th>
              <th className="text-left p-2 text-sm font-medium text-foreground w-44">Name</th>
              <th className="text-left p-2 text-sm font-medium text-foreground w-32">Type</th>
              <th className="text-left p-2 text-sm font-medium text-foreground">Requirement</th>
              <th className="text-left p-2 text-sm font-medium text-foreground w-28">Priority</th>
              <th className="text-left p-2 text-sm font-medium text-foreground w-28">Status</th>
              <th className="text-left p-2 text-sm font-medium text-foreground w-28">Approval</th>
              <th className="text-left p-2 text-sm font-medium text-foreground w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={index}
                className={`border-b border-border hover:bg-accent ${draggedIndex === index ? 'opacity-50' : ''}`}
                draggable
                onDragStart={e => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedIndices.has(index)}
                    onChange={e => {
                      const next = new Set(selectedIndices)
                      if (e.target.checked) next.add(index); else next.delete(index)
                      setSelectedIndices(next)
                    }}
                    className="rounded"
                  />
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-1">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                    <div className="flex flex-col">
                      <button type="button" onClick={() => moveRow(index, 'top')} disabled={index === 0} className="p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors" title="Move to top">
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button type="button" onClick={() => moveRow(index, 'bottom')} disabled={index === rows.length - 1} className="p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors" title="Move to bottom">
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    value={row.id}
                    onChange={e => updateRow(index, 'id', e.target.value)}
                    placeholder="NFR-000000000"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    value={row.name}
                    onChange={e => updateRow(index, 'name', e.target.value)}
                    placeholder="Requirement name"
                  />
                </td>
                <td className="p-2">
                  <select
                    className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    value={row.type}
                    onChange={e => updateRow(index, 'type', e.target.value)}
                  >
                    <option value="">Select type</option>
                    {NFR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td className="p-2">
                  <textarea
                    className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y min-h-[60px]"
                    value={row.requirement}
                    onChange={e => updateRow(index, 'requirement', e.target.value)}
                    placeholder="Describe the requirement"
                    rows={2}
                  />
                </td>
                <td className="p-2">
                  <select
                    className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    value={row.priority}
                    onChange={e => updateRow(index, 'priority', e.target.value)}
                  >
                    {Object.values(PRIORITY_VALUES.REQUIREMENT).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </td>
                <td className="p-2">
                  <select
                    className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    value={row.status}
                    onChange={e => updateRow(index, 'status', e.target.value)}
                  >
                    {Object.values(STATUS_VALUES.REQUIREMENT).sort().map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </td>
                <td className="p-2">
                  <select
                    className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    value={row.approval}
                    onChange={e => updateRow(index, 'approval', e.target.value)}
                  >
                    {Object.values(APPROVAL_VALUES).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </td>
                <td className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete "${row.name || row.id}"?`)) deleteRow(index)
                    }}
                    className="p-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p className="text-center text-muted-foreground py-6 text-sm">No project-level NFRs defined yet. Click "Add NFR" to create one.</p>
      )}

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        <Plus size={16} />
        Add NFR
      </button>
    </div>
  )
}
