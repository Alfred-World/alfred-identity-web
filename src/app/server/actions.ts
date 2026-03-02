'use server'

import type { PricingPlanType } from '@/types/pages/pricingTypes'
import type { InvoiceType } from '@/types/apps/invoiceTypes'

export const getPricingData = async (): Promise<PricingPlanType[]> => {
  return [
    {
      title: 'Basic',
      monthlyPrice: 0,
      currentPlan: true,
      popularPlan: false,
      subtitle: 'A simple start for everyone',
      imgSrc: '/images/illustrations/objects/pricing-basic.png',
      imgHeight: 99,
      yearlyPlan: { monthly: 0, annually: 0 },
      planBenefits: ['100 responses a month', '3 embeds', 'Unlimited Forms and Surveys', '1 User', 'Basic Support']
    },
    {
      title: 'Standard',
      monthlyPrice: 49,
      currentPlan: false,
      popularPlan: true,
      subtitle: 'For small to medium businesses',
      imgSrc: '/images/illustrations/objects/pricing-standard.png',
      imgHeight: 99,
      yearlyPlan: { monthly: 40, annually: 480 },
      planBenefits: ['Unlimited Responses', '5 embeds', 'Unlimited Forms and Surveys', '3 Users', 'Standard Support']
    },
    {
      title: 'Enterprise',
      monthlyPrice: 99,
      currentPlan: false,
      popularPlan: false,
      subtitle: 'Solution for big organizations',
      imgSrc: '/images/illustrations/objects/pricing-enterprise.png',
      imgHeight: 99,
      yearlyPlan: { monthly: 80, annually: 960 },
      planBenefits: [
        'Unlimited Responses',
        'Unlimited embeds',
        'Unlimited Forms and Surveys',
        'Unlimited Users',
        'Premium Support'
      ]
    }
  ]
}

export const getInvoiceData = async (): Promise<InvoiceType[]> => {
  return []
}
