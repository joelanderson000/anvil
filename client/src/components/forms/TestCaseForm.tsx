import React, { useEffect } from 'react'
import { Plus, Trash2, Lock } from 'lucide-react'
import { TestCaseFormData, TraceLink, TestProcedureStep } from '../../utils/markdownUtils'
import { STATUS_VALUES, APPROVAL_VALUES, VERIFICATION_METHOD_VALUES, PASS_FAIL_VALUES } from '../../utils/constants'

interface TestCaseFormProps {
  data: TestCaseFormData
  onChange: (updates: Partial<TestCaseFormData>) => void
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

export function TestCaseForm({ data, onChange, onValidationChange }: TestCaseFormProps): JSX.Element {
  useEffect(() => {
    const errors: Record<string, string> = {}
    if (!data.name?.trim()) errors.name = 'Name is required'
    onValidationChange?.(Object.keys(errors).length === 0, errors)
  }, [data.name])

  const steps = data.testProcedure || []

  const updateStep = (idx: number, field: keyof TestProcedureStep, value: string) => {
    const updated = [...steps]
    updated[idx] = { ...updated[idx], [field]: value }
    onChange({ testProcedure: updated })
  }

  const addStep = () => {
    onChange({ testProcedure: [...steps, { step: String(steps.length + 1), action: '', expectedResult: '' }] })
  }

  const removeStep = (idx: number) => {
    onChange({ testProcedure: steps.filter((_, i) => i !== idx) })
  }

  const passFailColor = {
    'Not Executed': 'text-muted-foreground',
    'Pass': 'text-green-600',
    'Fail': 'text-red-600',
    'Blocked': 'text-yellow-600'
  }[data.passFail] || 'text-muted-foreground'

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
            placeholder="Test Case Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">System Requirement ID</label>
          <input
            type="text"
            value={data.srId}
            onChange={e => onChange({ srId: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            placeholder="SR-XXXXXXXXX"
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
          <label className="block text-sm font-medium text-foreground mb-1">Status</label>
          <select
            value={data.status}
            onChange={e => onChange({ status: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            {Object.values(STATUS_VALUES.TEST_CASE).map(v => (
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
          <label className="block text-sm font-medium text-foreground mb-1">
            Pass/Fail Status
            <Lock className="inline w-3 h-3 ml-1 text-muted-foreground" title="Set during test execution only" />
          </label>
          <div className={`w-full px-3 py-2 border border-border rounded-md bg-muted ${passFailColor} font-medium`}>
            {data.passFail}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Set via test execution only — not editable here.</p>
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

      {/* Objective */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Objective</label>
        <p className="text-xs text-muted-foreground mb-1">One sentence: what SR criterion this test demonstrates.</p>
        <textarea
          value={data.objective || ''}
          onChange={e => onChange({ objective: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
        />
      </div>

      {/* Prerequisites */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Prerequisites</label>
        <textarea
          value={data.prerequisites || ''}
          onChange={e => onChange({ prerequisites: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          placeholder="Environment, dependencies, data setup..."
        />
      </div>

      {/* Test Procedure */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-foreground">Test Procedure</label>
          <button
            type="button"
            onClick={addStep}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
          >
            <Plus className="w-3 h-3" /> Add Step
          </button>
        </div>
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground w-16">Step</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Action</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Expected Result</th>
                <th className="px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {steps.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-3 text-center text-muted-foreground text-xs">No steps defined</td>
                </tr>
              ) : (
                steps.map((step, idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={step.step}
                        onChange={e => updateStep(idx, 'step', e.target.value)}
                        className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-primary rounded text-xs text-center"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <textarea
                        value={step.action}
                        onChange={e => updateStep(idx, 'action', e.target.value)}
                        rows={2}
                        className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-primary rounded text-xs resize-none"
                        placeholder="What to do"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <textarea
                        value={step.expectedResult}
                        onChange={e => updateStep(idx, 'expectedResult', e.target.value)}
                        rows={2}
                        className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-primary rounded text-xs resize-none"
                        placeholder="Expected outcome"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <button
                        type="button"
                        onClick={() => removeStep(idx)}
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

      {/* Actual Result — read-only, filled during execution */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Actual Result
          <Lock className="inline w-3 h-3 ml-1 text-muted-foreground" title="Filled during test execution" />
        </label>
        <div className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground min-h-[4rem] text-sm whitespace-pre-wrap">
          {data.actualResult || 'Not yet executed.'}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Filled during execution via the test runner — not editable here.</p>
      </div>

      {/* Pass/Fail Determination */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Pass / Fail Determination</label>
        <p className="text-xs text-muted-foreground mb-1">The specific condition that constitutes a Pass vs. Fail outcome.</p>
        <textarea
          value={data.passFailDetermination || ''}
          onChange={e => onChange({ passFailDetermination: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
        />
      </div>

      {/* Verified SRs */}
      <TracelinkTable
        label="Verified System Requirements"
        links={data.verifiedSRs || []}
        idPlaceholder="SR-XXXXXXXXX"
        onChange={links => onChange({ verifiedSRs: links })}
      />
    </div>
  )
}
