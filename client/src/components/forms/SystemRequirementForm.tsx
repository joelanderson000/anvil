import React, { useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { SystemRequirementFormData, TraceLink } from '../../utils/markdownUtils'
import { STATUS_VALUES, APPROVAL_VALUES, PRIORITY_VALUES, VERIFICATION_METHOD_VALUES } from '../../utils/constants'

interface SystemRequirementFormProps {
  data: SystemRequirementFormData
  onChange: (updates: Partial<SystemRequirementFormData>) => void
  onValidationChange?: (isValid: boolean, errors: Record<string, string>) => void
}

function TracelinkTable({
  label,
  links,
  idPlaceholder,
  onChange
}: {
  label: string
  links: TraceLink[]
  idPlaceholder: string
  onChange: (links: TraceLink[]) => void
}): JSX.Element {
  const update = (idx: number, field: keyof TraceLink, value: string) => {
    const updated = [...links]
    updated[idx] = { ...updated[idx], [field]: value }
    onChange(updated)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-foreground">{label}</label>
        <button
          type="button"
          onClick={() => onChange([...links, { id: '', description: '' }])}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Description</th>
              <th className="px-2 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {links.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-3 text-center text-muted-foreground text-xs">None linked</td>
              </tr>
            ) : (
              links.map((link, idx) => (
                <tr key={idx} className="border-t border-border">
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={link.id}
                      onChange={e => update(idx, 'id', e.target.value)}
                      className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-primary rounded text-xs"
                      placeholder={idPlaceholder}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={link.description}
                      onChange={e => update(idx, 'description', e.target.value)}
                      className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-primary rounded text-xs"
                      placeholder="Brief description"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <button
                      type="button"
                      onClick={() => onChange(links.filter((_, i) => i !== idx))}
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
  )
}

export function SystemRequirementForm({ data, onChange, onValidationChange }: SystemRequirementFormProps): JSX.Element {
  useEffect(() => {
    const errors: Record<string, string> = {}
    if (!data.name?.trim()) errors.name = 'Name is required'
    onValidationChange?.(Object.keys(errors).length === 0, errors)
  }, [data.name])

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
            placeholder="System Requirement Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Customer Requirement ID</label>
          <input
            type="text"
            value={data.crId}
            onChange={e => onChange({ crId: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            placeholder="CR-XXXXXXXXX"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Verification Method</label>
          <select
            value={data.verificationMethod}
            onChange={e => onChange({ verificationMethod: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            {Object.values(VERIFICATION_METHOD_VALUES).map(v => (
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
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Status</label>
          <select
            value={data.status}
            onChange={e => onChange({ status: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            {Object.values(STATUS_VALUES.SYSTEM_REQUIREMENT).map(v => (
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
        <p className="text-xs text-muted-foreground mb-1">Precise, measurable: "The system shall [action] [condition] [measurable criterion]."</p>
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
        <textarea
          value={data.rationale || ''}
          onChange={e => onChange({ rationale: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
        />
      </div>

      {/* Verification Criteria */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Verification Criteria</label>
        <p className="text-xs text-muted-foreground mb-1">How this requirement will be objectively verified.</p>
        <textarea
          value={data.verificationCriteria || ''}
          onChange={e => onChange({ verificationCriteria: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
        />
      </div>

      {/* Traceability tables */}
      <TracelinkTable
        label="Parent Customer Requirements"
        links={data.parentCRs || []}
        idPlaceholder="CR-XXXXXXXXX"
        onChange={links => onChange({ parentCRs: links })}
      />

      <TracelinkTable
        label="Allocated Functions"
        links={data.allocatedFunctions || []}
        idPlaceholder="FUN-XXXXXXXXX"
        onChange={links => onChange({ allocatedFunctions: links })}
      />

      <TracelinkTable
        label="Verification Test Cases"
        links={data.verificationTestCases || []}
        idPlaceholder="TC-XXXXXXXXX"
        onChange={links => onChange({ verificationTestCases: links })}
      />
    </div>
  )
}
