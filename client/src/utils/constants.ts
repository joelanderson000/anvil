// Application-wide constants for consistent data values

export interface StatusValues {
  [key: string]: string
}

export interface PriorityValues {
  [key: string]: string
}

export const STATUS_VALUES = {
  CAPABILITY: {
    IN_DRAFT: 'In Draft',
    READY_FOR_ANALYSIS: 'Ready for Analysis',
    IN_ANALYSIS: 'In Analysis',
    READY_FOR_DESIGN: 'Ready for Design',
    IN_DESIGN: 'In Design',
    READY_FOR_IMPLEMENTATION: 'Ready for Implementation',
    IN_IMPLEMENTATION: 'In Implementation',
    IMPLEMENTED: 'Implemented',
    READY_FOR_REFACTOR: 'Ready for Refactor'
  } as const,
  ENABLER: {
    READY_FOR_ANALYSIS: 'Ready for Analysis',
    READY_FOR_DESIGN: 'Ready for Design',
    READY_FOR_IMPLEMENTATION: 'Ready for Implementation',
    READY_FOR_REFACTOR: 'Ready for Refactor',
    READY_FOR_RETIREMENT: 'Ready for Retirement',
    IMPLEMENTED: 'Implemented',
    IN_ANALYSIS: 'In Analysis',
    IN_DESIGN: 'In Design',
    IN_DRAFT: 'In Draft',
    IN_IMPLEMENTATION: 'In Implementation',
    IN_REFACTOR: 'In Refactor',
    IN_RETIREMENT: 'In Retirement',
    RETIRED: 'Retired'
  } as const,
  REQUIREMENT: {
    READY_FOR_DESIGN: 'Ready for Design',
    READY_FOR_IMPLEMENTATION: 'Ready for Implementation',
    READY_FOR_REFACTOR: 'Ready for Refactor',
    READY_FOR_RETIREMENT: 'Ready for Retirement',
    IMPLEMENTED: 'Implemented',
    IN_DRAFT: 'In Draft',
    RETIRED: 'Retired',
    VERIFIED: 'Verified'
  } as const,
  CUSTOMER_REQUIREMENT: {
    IN_DRAFT: 'In Draft',
    READY_FOR_REVIEW: 'Ready for Review',
    APPROVED: 'Approved',
    CLOSED: 'Closed'
  } as const,
  SYSTEM_REQUIREMENT: {
    IN_DRAFT: 'In Draft',
    READY_FOR_REVIEW: 'Ready for Review',
    ALLOCATED: 'Allocated',
    VERIFIED: 'Verified',
    CLOSED: 'Closed'
  } as const,
  TEST_CASE: {
    IN_DRAFT: 'In Draft',
    READY_FOR_REVIEW: 'Ready for Review',
    APPROVED: 'Approved',
    EXECUTED: 'Executed'
  } as const
} as const

export const PASS_FAIL_VALUES = {
  NOT_EXECUTED: 'Not Executed',
  PASS: 'Pass',
  FAIL: 'Fail',
  BLOCKED: 'Blocked'
} as const

export const VERIFICATION_METHOD_VALUES = {
  TEST: 'Test',
  INSPECTION: 'Inspection',
  ANALYSIS: 'Analysis',
  DEMONSTRATION: 'Demonstration'
} as const

export const APPROVAL_VALUES = {
  NOT_APPROVED: 'Not Approved',
  PENDING: 'Pending',
  APPROVED: 'Approved'
} as const

export const PRIORITY_VALUES = {
  CAPABILITY_ENABLER: {
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low'
  } as const,
  REQUIREMENT: {
    MUST_HAVE: 'Must Have',
    SHOULD_HAVE: 'Should Have',
    COULD_HAVE: 'Could Have',
    WONT_HAVE: "Won't Have"
  } as const
} as const

export const REVIEW_VALUES = {
  REQUIRED: 'Required',
  NOT_REQUIRED: 'Not Required'
} as const

// Default values for new documents
export const DEFAULT_VALUES = {
  STATUS: STATUS_VALUES.ENABLER.IN_DRAFT,
  STATUS_CAPABILITY: STATUS_VALUES.CAPABILITY.IN_DRAFT,
  APPROVAL: APPROVAL_VALUES.NOT_APPROVED,
  PRIORITY_CAPABILITY: PRIORITY_VALUES.CAPABILITY_ENABLER.HIGH,
  PRIORITY_REQUIREMENT: PRIORITY_VALUES.REQUIREMENT.MUST_HAVE,
  ANALYSIS_REVIEW: REVIEW_VALUES.REQUIRED,
  DESIGN_REVIEW: REVIEW_VALUES.REQUIRED,
  CODE_REVIEW: REVIEW_VALUES.NOT_REQUIRED
} as const

// Type exports for better type safety
export type CapabilityStatus = typeof STATUS_VALUES.CAPABILITY[keyof typeof STATUS_VALUES.CAPABILITY]
export type EnablerStatus = typeof STATUS_VALUES.ENABLER[keyof typeof STATUS_VALUES.ENABLER]
export type RequirementStatus = typeof STATUS_VALUES.REQUIREMENT[keyof typeof STATUS_VALUES.REQUIREMENT]
export type CustomerRequirementStatus = typeof STATUS_VALUES.CUSTOMER_REQUIREMENT[keyof typeof STATUS_VALUES.CUSTOMER_REQUIREMENT]
export type SystemRequirementStatus = typeof STATUS_VALUES.SYSTEM_REQUIREMENT[keyof typeof STATUS_VALUES.SYSTEM_REQUIREMENT]
export type TestCaseStatus = typeof STATUS_VALUES.TEST_CASE[keyof typeof STATUS_VALUES.TEST_CASE]
export type PassFailValue = typeof PASS_FAIL_VALUES[keyof typeof PASS_FAIL_VALUES]
export type VerificationMethodValue = typeof VERIFICATION_METHOD_VALUES[keyof typeof VERIFICATION_METHOD_VALUES]
export type ApprovalValue = typeof APPROVAL_VALUES[keyof typeof APPROVAL_VALUES]
export type PriorityValue = typeof PRIORITY_VALUES.CAPABILITY_ENABLER[keyof typeof PRIORITY_VALUES.CAPABILITY_ENABLER] | typeof PRIORITY_VALUES.REQUIREMENT[keyof typeof PRIORITY_VALUES.REQUIREMENT]
export type ReviewValue = typeof REVIEW_VALUES[keyof typeof REVIEW_VALUES]
