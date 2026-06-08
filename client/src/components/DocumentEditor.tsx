import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, NavigateFunction, Location } from 'react-router-dom'
import { apiService } from '../services/apiService'
import { useApp } from '../contexts/AppContext'
import { Save, ArrowLeft, Eye, Code } from 'lucide-react'
import toast from 'react-hot-toast'
import { parseMarkdownToForm, convertFormToMarkdown, CapabilityFormData, EnablerFormData, FunctionFormData, ComponentFormData, CustomerRequirementFormData, SystemRequirementFormData, TestCaseFormData } from '../utils/markdownUtils'
import { generateCapabilityId, generateEnablerId, generateFunctionId, generateComponentId, generateCustomerRequirementId, generateSystemRequirementId, generateTestCaseId } from '../utils/idGenerator'
import { nameToFilename, namesGenerateDifferentFilenames, idToFilename } from '../utils/fileUtils'
import CapabilityForm from './forms/CapabilityForm'
import EnablerForm from './forms/EnablerForm'
import { CustomerRequirementForm } from './forms/CustomerRequirementForm'
import { SystemRequirementForm } from './forms/SystemRequirementForm'
import { TestCaseForm } from './forms/TestCaseForm'

interface DocumentParams {
  type: string
  '*': string | undefined
  capabilityId?: string
}

interface FileData {
  content: string
  path?: string
}

interface TemplateData {
  content: string
}

interface ValidationState {
  isValid: boolean
  errors: Record<string, string>
}

interface EnablerLocationState {
  enablerData?: Partial<EnablerFormData>
}

type FormData = CapabilityFormData | EnablerFormData | Record<string, any>

export default function DocumentEditor(): JSX.Element {
  const params = useParams() as DocumentParams
  const { type, '*': path, capabilityId } = params
  const navigate: NavigateFunction = useNavigate()
  const location: Location = useLocation()
  const { refreshData, config, capabilities, enablers, customerRequirements, systemRequirements, testCases, setSelectedDocument, suppressExternalChangeNotification } = useApp()
  
  const [document, setDocument] = useState<FileData | null>(null)
  const [formData, setFormData] = useState<FormData>({})
  const [markdownContent, setMarkdownContent] = useState<string>('')
  const [editMode, setEditMode] = useState<'form' | 'markdown'>('form')
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [isNew, setIsNew] = useState<boolean>(!path)
  const [originalCapabilityId, setOriginalCapabilityId] = useState<string | null>(null)
  const [originalName, setOriginalName] = useState<string>('')
  const [validationState, setValidationState] = useState<ValidationState>({ isValid: true, errors: {} })

  useEffect(() => {
    if (path) {
      loadDocument()
    } else {
      initializeNewDocument()
    }
  }, [path, type])

  const loadDocument = async (): Promise<void> => {
    try {
      setLoading(true)
      const data: FileData = await apiService.getFile(path!)
      setDocument(data)
      setMarkdownContent(data.content)
      
      const parsed = parseMarkdownToForm(data.content, type)
      setFormData(parsed)
      
      if (parsed.name) {
        setOriginalName(parsed.name)
      }
      if (type === 'enabler' && (parsed as EnablerFormData).capabilityId) {
        setOriginalCapabilityId((parsed as EnablerFormData).capabilityId || null)
      }
    } catch (err) {
      toast.error(`Failed to load document: ${(err as Error).message}`)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const initializeNewDocument = async (): Promise<void> => {
    try {
      setLoading(true)
      
      try {
        let template: TemplateData

        if (type === 'enabler') {
          const response = await fetch(`/api/enabler-template/${capabilityId || ''}`)
          template = await response.json()
        } else if (type === 'capability') {
          const response = await fetch('/api/capability-template')
          template = await response.json()
        } else if (type === 'function') {
          const response = await fetch('/api/function-template')
          template = await response.json()
        } else if (type === 'component') {
          const response = await fetch(`/api/component-template/${capabilityId || ''}`)
          template = await response.json()
        } else if (type === 'customer-requirement' || type === 'system-requirement' || type === 'test-case') {
          template = await apiService.getTemplate(type)
        } else {
          throw new Error('Unsupported document type')
        }

        setMarkdownContent(template.content)
        const parsed = parseMarkdownToForm(template.content, type)

        if (type === 'capability') {
          const capParsed = parsed as CapabilityFormData
          capParsed.owner = config?.owner || 'Product Team'
          if (!capParsed.id) capParsed.id = generateId('CAP')
          capParsed.lastSelectedCapabilityPath = config?.lastSelectedCapabilityPath as string
        } else if (type === 'function') {
          const funParsed = parsed as FunctionFormData
          funParsed.owner = config?.owner || 'Product Team'
          if (!funParsed.id) funParsed.id = generateId('FUN')
          funParsed.lastSelectedCapabilityPath = config?.lastSelectedCapabilityPath as string
        } else if (type === 'enabler') {
          const enablerParsed = parsed as EnablerFormData
          enablerParsed.owner = config?.owner || 'Product Team'
          enablerParsed.analysisReview = config?.analysisReview || 'Required'
          enablerParsed.codeReview = config?.codeReview || 'Not Required'
          if (!enablerParsed.approval) enablerParsed.approval = 'Not Approved'
          if (!enablerParsed.id) enablerParsed.id = generateId('ENB')
          if (capabilityId) enablerParsed.capabilityId = capabilityId

          const locationState = location.state as EnablerLocationState
          if (locationState?.enablerData) {
            const enablerData = locationState.enablerData
            Object.assign(enablerParsed, {
              id: enablerData.id || enablerParsed.id,
              name: enablerData.name || '',
              description: enablerData.description || '',
              status: enablerData.status || enablerParsed.status,
              approval: enablerData.approval || enablerParsed.approval,
              priority: enablerData.priority || enablerParsed.priority,
              owner: enablerData.owner || enablerParsed.owner,
              developer: enablerData.developer || enablerParsed.developer,
              capabilityId: capabilityId || enablerData.capabilityId || enablerParsed.capabilityId
            })
          }
        } else if (type === 'component') {
          const cmpParsed = parsed as ComponentFormData
          cmpParsed.owner = config?.owner || 'Product Team'
          cmpParsed.analysisReview = config?.analysisReview || 'Required'
          cmpParsed.codeReview = config?.codeReview || 'Not Required'
          if (!cmpParsed.approval) cmpParsed.approval = 'Not Approved'
          if (!cmpParsed.id) cmpParsed.id = generateId('CMP')
          if (capabilityId) cmpParsed.capabilityId = capabilityId

          const locationState = location.state as EnablerLocationState
          if (locationState?.enablerData) {
            const enablerData = locationState.enablerData
            Object.assign(cmpParsed, {
              id: enablerData.id || cmpParsed.id,
              name: enablerData.name || '',
              status: enablerData.status || cmpParsed.status,
              approval: enablerData.approval || cmpParsed.approval,
              priority: enablerData.priority || cmpParsed.priority,
              owner: enablerData.owner || cmpParsed.owner,
              capabilityId: capabilityId || enablerData.capabilityId || cmpParsed.capabilityId
            })
          }
        }
        // For CR/SR/TC the template already has the generated ID embedded

        setFormData(parsed)
      } catch (templateErr) {
        const defaultData = getDefaultFormData(type, capabilityId)
        setFormData(defaultData)
        setMarkdownContent(convertFormToMarkdown(defaultData, type))
      }
    } catch (err) {
      toast.error(`Failed to initialize document: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const getDefaultFormData = (type: string, presetCapabilityId?: string): FormData => {
    const base = {
      name: '',
      owner: config?.owner || 'Product Team',
      analysisReview: config?.analysisReview || 'Required',
      codeReview: (type === 'enabler' || type === 'component') ? (config?.codeReview || 'Not Required') : undefined,
      status: 'In Draft',
      approval: 'Not Approved',
      priority: 'High'
    }

    if (type === 'capability') {
      return {
        ...base,
        id: generateId('CAP'),
        internalUpstream: [],
        internalDownstream: [],
        externalUpstream: '',
        externalDownstream: '',
        enablers: [],
        lastSelectedCapabilityPath: config?.lastSelectedCapabilityPath
      } as CapabilityFormData
    } else if (type === 'function') {
      return {
        ...base,
        id: generateId('FUN'),
        internalUpstream: [],
        internalDownstream: [],
        externalUpstream: '',
        externalDownstream: '',
        enablers: [],
        allocatedSystemRequirements: [],
        lastSelectedCapabilityPath: config?.lastSelectedCapabilityPath
      } as FunctionFormData
    } else if (type === 'enabler') {
      return {
        ...base,
        id: generateId('ENB'),
        capabilityId: presetCapabilityId || '',
        functionalRequirements: [],
        nonFunctionalRequirements: []
      } as EnablerFormData
    } else if (type === 'component') {
      return {
        ...base,
        id: generateId('CMP'),
        capabilityId: presetCapabilityId || '',
        functionalRequirements: [],
        nonFunctionalRequirements: []
      } as ComponentFormData
    }

    return base
  }

  const generateId = (prefix: string): string => {
    if (prefix === 'CAP') {
      const existingIds = (capabilities || []).map(cap => cap.id).filter(Boolean) as string[]
      return generateCapabilityId(existingIds)
    } else if (prefix === 'FUN') {
      const existingIds = (capabilities || []).map(cap => cap.id).filter(Boolean) as string[]
      return generateFunctionId(existingIds)
    } else if (prefix === 'ENB') {
      const existingIds = (enablers || []).map(enb => enb.id).filter(Boolean) as string[]
      return generateEnablerId(existingIds)
    } else if (prefix === 'CMP') {
      const existingIds = (enablers || []).map(enb => enb.id).filter(Boolean) as string[]
      return generateComponentId(existingIds)
    } else if (prefix === 'CR') {
      const existingIds = (customerRequirements || []).map(cr => cr.id).filter(Boolean) as string[]
      return generateCustomerRequirementId(existingIds)
    } else if (prefix === 'SR') {
      const existingIds = (systemRequirements || []).map(sr => sr.id).filter(Boolean) as string[]
      return generateSystemRequirementId(existingIds)
    } else if (prefix === 'TC') {
      const existingIds = (testCases || []).map(tc => tc.id).filter(Boolean) as string[]
      return generateTestCaseId(existingIds)
    }

    const timestamp = Date.now().toString().slice(-2)
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
    return `${prefix}-${timestamp}${random}`
  }

  const handleSave = async (): Promise<void> => {
    try {
      setSaving(true)

      if ((type === 'enabler' || type === 'component') && editMode === 'form' && !validationState.isValid) {
        toast.error('Please select a Function ID before saving')
        setSaving(false)
        return
      }

      const capFormData = formData as CapabilityFormData
      if ((type === 'capability' || type === 'function') && isNew && editMode === 'form' && !capFormData.selectedPath) {
        toast.error('Please select a save path before saving')
        setSaving(false)
        return
      }

      let isMovingCapability = false
      let originalPath: string | null = null
      if ((type === 'capability' || type === 'function') && !isNew && editMode === 'form' && capFormData.selectedPath && path) {
        const currentDir = path.includes('/') || path.includes('\\')
          ? path.substring(0, path.lastIndexOf('/') || path.lastIndexOf('\\'))
          : ''

        if (currentDir !== capFormData.selectedPath) {
          isMovingCapability = true
          originalPath = path
          console.log(`[CAPABILITY-MOVE] Moving capability from ${currentDir} to ${capFormData.selectedPath}`)
        }
      }

      let contentToSave: string
      if (editMode === 'form') {
        contentToSave = convertFormToMarkdown(formData, type)
      } else {
        contentToSave = markdownContent
      }

      let savePath: string | undefined = path
      let needsRename = false
      let newPath: string | null = null

      if (isNew) {
        const fd = formData as any
        const filename = fd.id ? idToFilename(fd.id, type) : nameToFilename(fd.name || 'untitled', type)

        if ((type === 'capability' || type === 'function') && capFormData.selectedPath) {
          savePath = `${capFormData.selectedPath}/${filename}`
        } else {
          savePath = filename
        }
      } else if (isMovingCapability) {
        const filename = path!.split('/').pop()!.split('\\').pop()!
        savePath = `${capFormData.selectedPath}/${filename}`
        needsRename = true
        newPath = savePath
      } else if (!isNew && originalName && formData.name && formData.name !== originalName) {
        // For capabilities and enablers, the name change is handled by updating
        // the metadata within the file content only - no file rename needed
      }

      // Suppress external change notifications before saving
      suppressExternalChangeNotification(savePath!, 5000)

      if ((type === 'capability' || type === 'function') && editMode === 'form') {
        await apiService.saveCapabilityWithEnablers(
          savePath!,
          contentToSave,
          capFormData.id || '',
          capFormData.internalUpstream || [],
          capFormData.internalDownstream || [],
          capFormData.enablers || []
        )
      } else if ((type === 'enabler' || type === 'component') && editMode === 'form') {
        await apiService.saveEnablerWithReparenting(
          savePath!,
          contentToSave,
          formData as EnablerFormData,
          originalCapabilityId
        )
      } else {
        await apiService.saveFile(savePath!, contentToSave)
      }
      
      if (needsRename && newPath) {
        if (isMovingCapability) {
          console.log(`[CAPABILITY-MOVE] Moving capability from ${path} to ${newPath}`)
          await apiService.renameFile(path!, newPath)

          if (capFormData.enablers && capFormData.enablers.length > 0) {
            console.log(`[CAPABILITY-MOVE] Moving ${capFormData.enablers.length} enablers`)
            for (const enabler of capFormData.enablers) {
              if (enabler.id) {
                try {
                  const cmpType = enabler.id.startsWith('CMP-') ? 'component' : 'enabler'
                  const enablerFilename = idToFilename(enabler.id, cmpType)
                  const enablerPath = idToFilename(enabler.id, cmpType)
                  const newEnablerPath = `${capFormData.selectedPath}/${enablerFilename}`

                  console.log(`[COMPONENT-MOVE] Moving component ${enabler.id} to ${newEnablerPath}`)
                  await apiService.renameFile(enablerPath, newEnablerPath)
                } catch (enablerError) {
                  console.warn(`[ENABLER-MOVE] Failed to move enabler ${enabler.id}:`, (enablerError as Error).message)
                }
              }
            }
          }
        } else {
          console.log(`[RENAME] Renaming file from ${savePath} to ${newPath}`)
          await apiService.renameFile(savePath!, newPath)
          setOriginalName(formData.name || '')
        }
        savePath = newPath
      }
      
      if ((type === 'capability' || type === 'function') && isNew && capFormData.selectedPath) {
        try {
          await apiService.updateConfig({
            lastSelectedCapabilityPath: capFormData.selectedPath
          })
          console.log(`[PATH-PREFERENCE] Saved path preference: ${capFormData.selectedPath}`)
        } catch (error) {
          console.error('Error saving path preference:', error)
        }
      }

      // Update individual component/enabler files if this is a function/capability with component changes
      if ((type === 'capability' || type === 'function') && capFormData.enablers) {
        const isFunction = type === 'function'
        for (const enabler of capFormData.enablers) {
          if (enabler.id) {
            try {
              const isCmp = enabler.id.startsWith('CMP-')
              const fileType = isCmp ? 'component' : 'enabler'
              const suffix = isCmp ? '-component.md' : '-enabler.md'
              const idNum = enabler.id.replace(/^(CMP|ENB)-/i, '')
              const enablerResponse = await apiService.getFile(`${idNum}${suffix}`)
              if (enablerResponse.content) {
                const existingEnablerData = parseMarkdownToForm(enablerResponse.content, fileType)
                const updatedEnablerData = {
                  ...existingEnablerData,
                  name: enabler.name || existingEnablerData.name,
                  status: enabler.status || existingEnablerData.status,
                  approval: enabler.approval || existingEnablerData.approval,
                  priority: enabler.priority || existingEnablerData.priority
                }
                const updatedEnablerMarkdown = convertFormToMarkdown(updatedEnablerData, fileType)
                await apiService.saveFile(`${idNum}${suffix}`, updatedEnablerMarkdown)
              }
            } catch (enablerError) {
              console.warn(`[COMPONENT-UPDATE] Failed to update component ${enabler.id}:`, (enablerError as Error).message)
            }
          }
        }
      }

      refreshData()
      
      const filename = savePath!.split('/').pop()!.split('\\').pop()!

      if (type === 'capability' || type === 'enabler' || type === 'function' || type === 'component') {
        setSelectedDocument({
          type: (type === 'function' ? 'capability' : type === 'component' ? 'enabler' : type) as 'capability' | 'enabler',
          path: filename,
          id: (formData as any).name || (formData as any).id || filename
        })
      }

      navigate(`/view/${type}/${filename}`)
      
    } catch (err) {
      toast.error(`Failed to save document: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleFormDataChange = (newData: Partial<FormData>): void => {
    setFormData({ ...formData, ...newData })
  }

  const handleValidationChange = (isValid: boolean, errors: Record<string, string>): void => {
    setValidationState({ isValid, errors })
  }

  const handleModeSwitch = (newMode: 'form' | 'markdown'): void => {
    try {
      if (newMode === 'markdown' && editMode === 'form') {
        const markdown = convertFormToMarkdown(formData, type)
        setMarkdownContent(markdown)
      } else if (newMode === 'form' && editMode === 'markdown') {
        try {
          const parsed = parseMarkdownToForm(markdownContent, type)
          setFormData(parsed)
        } catch (parseError) {
          console.error('Failed to parse markdown to form data:', parseError)
          toast.error('Failed to parse markdown content. Please check the format and try again.')
          return
        }
      }
      setEditMode(newMode)
    } catch (error) {
      console.error('Error switching editor modes:', error)
      toast.error(`Failed to switch to ${newMode} mode: ${(error as Error).message}`)
    }
  }

  const handleBack = (): void => {
    if (isNew) {
      navigate('/')
    } else {
      navigate(`/view/${type}/${path}`)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground">Loading editor...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky -top-4 z-10 bg-card border-b border-border shadow-sm mb-4 p-4 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">{isNew ? `Create ${type}` : `Edit ${type}`}</h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-border overflow-hidden">
              <button
                className={`flex items-center gap-1 px-3 py-2 text-sm ${editMode === 'form' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-accent hover:text-accent-foreground'} transition-colors`}
                onClick={() => handleModeSwitch('form')}
              >
                <Eye size={14} />
                Form
              </button>
              <button
                className={`flex items-center gap-1 px-3 py-2 text-sm border-l border-border ${editMode === 'markdown' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-accent hover:text-accent-foreground'} transition-colors`}
                onClick={() => handleModeSwitch('markdown')}
              >
                <Code size={14} />
                Markdown
              </button>
            </div>

            <button onClick={handleBack} className="flex items-center gap-2 px-3 py-2 text-sm bg-muted text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
              <ArrowLeft size={16} />
              Back
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-chart-2 text-white rounded-md hover:bg-chart-2/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* REVERT MARKER: Changed from max-w-7xl to max-w-screen-2xl for 20% wider EnablerForm - v3.4.17 */}
      <div className="max-w-screen-2xl mx-auto p-6">
        {editMode === 'form' ? (
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            {(type === 'capability' || type === 'function') && (
              <CapabilityForm
                data={formData as CapabilityFormData}
                onChange={handleFormDataChange}
                isNew={isNew}
                currentPath={path ? path.substring(0, path.lastIndexOf('/')) : null}
              />
            )}
            {(type === 'enabler' || type === 'component') && (
              <EnablerForm
                data={formData as EnablerFormData}
                onChange={handleFormDataChange}
                onValidationChange={handleValidationChange}
              />
            )}
            {type === 'customer-requirement' && (
              <CustomerRequirementForm
                data={formData as CustomerRequirementFormData}
                onChange={handleFormDataChange}
                onValidationChange={handleValidationChange}
              />
            )}
            {type === 'system-requirement' && (
              <SystemRequirementForm
                data={formData as SystemRequirementFormData}
                onChange={handleFormDataChange}
                onValidationChange={handleValidationChange}
              />
            )}
            {type === 'test-case' && (
              <TestCaseForm
                data={formData as TestCaseFormData}
                onChange={handleFormDataChange}
                onValidationChange={handleValidationChange}
              />
            )}
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <textarea
              className="w-full h-[600px] px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent font-mono text-sm resize-none"
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
              placeholder="Enter markdown content..."
            />
          </div>
        )}
      </div>
    </div>
  )
}
