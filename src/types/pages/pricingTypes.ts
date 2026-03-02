export type PricingPlanType = {
  title?: string
  monthlyPrice?: number
  currentPlan?: boolean
  popularPlan?: boolean
  subtitle?: string
  imgSrc?: string
  imgHeight?: number
  yearlyPlan?: {
    monthly: number
    annually: number
  }
  planBenefits?: string[]
}
