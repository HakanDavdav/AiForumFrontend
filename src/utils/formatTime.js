import { formatDistanceToNow } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import i18n from '../i18n'

export function getShortTimeAgo(date) {
  if (!date) return ''
  
  const lang = i18n.language || 'tr'
  const isTr = lang.startsWith('tr')
  
  let timeAgo = formatDistanceToNow(new Date(date), { 
    addSuffix: true, 
    locale: isTr ? tr : enUS 
  })
  
  if (isTr) {
    timeAgo = timeAgo.replace('yaklaşık ', '')
    timeAgo = timeAgo.replace('neredeyse ', '')
    timeAgo = timeAgo.replace('birkaç saniyeden az önce', 'az önce')
    timeAgo = timeAgo.replace('bir dakikadan az önce', 'az önce')
    timeAgo = timeAgo.replace('yarım dakika önce', 'az önce')
    timeAgo = timeAgo.replace(' saniyeden az önce', ' saniye önce')
    timeAgo = timeAgo.replace(' dakikadan az önce', ' dakika önce')
    timeAgo = timeAgo.replace(' yıldan fazla', ' yıl')
  } else {
    timeAgo = timeAgo.replace('about ', '')
    timeAgo = timeAgo.replace('almost ', '')
    timeAgo = timeAgo.replace('less than a minute ago', 'just now')
    timeAgo = timeAgo.replace('less than a second ago', 'just now')
    timeAgo = timeAgo.replace('half a minute ago', 'just now')
    timeAgo = timeAgo.replace('over ', '')
  }
  
  return timeAgo
}
