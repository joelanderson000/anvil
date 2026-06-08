import React, { useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { CustomerRequirementFormData, TraceLink } from '../../utils/markdownUtils'
import { STATUS_VALUES, APPROVAL_VALUES, PRIORITY_VALUES } from '../../utils/constants'

interface CustomerRequirementFormProps {
  data: CustomerRequirementFormData
  onChange: (updates: Partial<CustomerRequirementFormData>) => void
  onValidationChange?: (isValid: boolean, errors: Record<string, string>) => void
}

export function CustomerRequirementForm({ data, onChange, onValidationChange }: CustomerRequirementFormProps): JSX.Element {
  useEffect(() => {
    const errors: Record<string, string> = {}
    if (!data.name?.trim()) errors.name = 'Name is required'
    if (!data.source?.trim()) errors.source = 'Source is required'
    onValidationChange?.(Object.keys(errors).length === 0, errors)
  }, [data.name, data.source])

  const updateLink = (links: TraceLink[], idx: number, field: keyof TraceLink, value: string): TraceLink[] => {
    const updated = [...links]
    updated[idx] = { ...updated[idx], [field]: value }
    return updated
  }

  const addLink = (links: TraceLink[]): TraceLink[] => [...links, { id: '', description: '' }]
  const removeLink = (links: TraceLink[], idx: number): TraceLink[] => links.filter((_, i) => i !== idx)

  const derivedSRs = data.derivedSystemRequirements || []

  return (
    <div className="space-y-6">
      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
          <input
            type="text"
            value={data.name}
            onChange={e => onChange({ name: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            placeholder="Customer Requirement Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Source *</label>
          <input
            type="text"
            value={data.source}
            onChange={e => onChange({ source: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            placeholder="Stakeholder / Organisation"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Status</label>
          <select
            value={data.status}
            onChange={e => onChange({ status: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            {Object.values(STATUS_VALUES.CUSTOMER_REQUIREMENT).map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Approval</label>
          <select
            value={data.approval}
            onChange={e => onChange({ approval: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            {Object.values(APPROVAL_VALUES).map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
          <select
            value={data.priority}
            onChange={e => onChange({ priority: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            {Object.values(PRIORITY_VALUES.CAPABILITY_ENABLER).map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        {data.id && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">ID</label>
            <input
              type="text"
              value={data.id}
              readOnly
              className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
            />
          </div>
        )}
      </div>

      {/* Statement */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Statement</label>
        <p className="text-xs text-muted-foreground mb-1">One clear sentence: "The system shall [capability] so that [stakeholder benefit]."</p>
        <textarea
          value={data.statement || ''}
          onChange={e => onChange({ statement: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground font-mono text-sm"
        />
      </div>

      {/* Rationale */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Rationale</label>
        <p className="text-xs text-muted-foreground mb-1">Operational context. Why does this need exist?</p>
        <textarea
          value={data.rationale || ''}
          onChange={e => onChange({ rationale: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
        />
      </div>

      {/* Acceptance Criteria */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Acceptance Criteria</label>
        <p className="text-xs text-muted-foreground mb-1">How will the stakeholder know this need is satisfied?</p>
        <textarea
          value={data.acceptanceCriteria || ''}
          onChange={e => onChange({ acceptanceCriteria: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
        />
      </div>

      {/* Derived System Requirements */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-foreground">Derived System Requirements</label>
          <button
            type="button"
            onClick={() => onChange({ derivedSystemRequirements: addLink(derivedSRs) })}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">SR ID</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Description</th>
                <th className="px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {derivedSRs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-3 text-center text-muted-foreground text-xs">No linked system requirements</td>
                </tr>
              ) : (
                derivedSRs.map((sr, idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={sr.id}
                        onChange={e => onChange({ derivedSystemRequirements: updateLink(derivedSRs, idx, 'id', e.target.value) })}
                        className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-primary rounded text-xs"
                        placeholder="SR-XXXXXXXXX"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={sr.description}
                        onChange={e => onChange({ derivedSystemRequirements: updateLink(derivedSRs, idx, 'description', e.target.value) })}
                        className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-primary rounded text-xs"
                        placeholder="Brief description"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <button
                        type="button"
                        onClick={() => onChange({ derivedSystemRequirements: removeLink(derivedSRs, idx) })}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
