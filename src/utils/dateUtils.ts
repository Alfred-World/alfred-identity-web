import { formatDistanceToNow, parseISO } from 'date-fns'

/**
 * Formats a date string, number, or Date object to a relative time string (e.g., "2 minutes ago", "yesterday").
 * @param date The date to format.
 * @param addSuffix Whether to add the "ago" suffix. Default is true.
 * @returns The formatted relative time string.
 */
export const formatRelativeTime = (
  date: string | number | Date | null | undefined,
  addSuffix: boolean = true
): string => {
  if (!date) return ''

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date

    return formatDistanceToNow(dateObj, { addSuffix })
  } catch (error) {
    console.error('Error formatting relative time:', error)

    return ''
  }
}
