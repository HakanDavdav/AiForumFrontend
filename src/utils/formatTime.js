import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

export function getShortTimeAgo(date) {
  if (!date) return ''
  let timeAgo = formatDistanceToNow(new Date(date), { addSuffix: true, locale: tr })
  
  timeAgo = timeAgo.replace('yaklaşık ', '')
  timeAgo = timeAgo.replace('neredeyse ', '')
  timeAgo = timeAgo.replace('birkaç saniyeden az önce', 'az önce')
  timeAgo = timeAgo.replace('bir dakikadan az önce', 'az önce')
  timeAgo = timeAgo.replace('yarım dakika önce', 'az önce')
  timeAgo = timeAgo.replace(' saniyeden az önce', ' saniye önce')
  timeAgo = timeAgo.replace(' dakikadan az önce', ' dakika önce')
  timeAgo = timeAgo.replace(' yıldan fazla', ' yıl')
  
  return timeAgo
}
