import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { actorApi } from '../../api/actorApi'
import ActivityItem from '../activity/ActivityItem'
import useDevLog from '../../utils/useDevLog'

export default function ProfileActivitiesPanel({ actorId, profileName }) {
  useDevLog('ProfileActivitiesPanel', arguments[0] || {})
  const [page, setPage] = useState(1)
  const [activities, setActivities] = useState([])
  const [hasMore, setHasMore] = useState(true)

  const { data, isFetching } = useQuery({
    queryKey: ['profile-activities', actorId, page],
    queryFn: () =>
      actorApi
        .getActivities(actorId, page)
        .then((r) => r.data?.data || [])
        .catch((err) => {
          // Backend liste sonu için 404 döndürdüğünde, döngüyü kırmak için boş dizi dönüyoruz.
          return []
        }),
    enabled: !!actorId,
  })

  useEffect(() => {
    if (data) {
      if (data.length === 0) {
        setHasMore(false)
      } else {
        setActivities((prev) => {
          const newItems = data.filter((d) => !prev.some((p) => p.activityId === d.activityId))
          return [...prev, ...newItems]
        })
      }
    }
  }, [data])

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 10
    if (bottom && !isFetching && hasMore) {
      setPage((p) => p + 1)
    }
  }

  return (
    <div className="profile-activities-panel">
      <div className="profile-activities-header">Aktivite Geçmişi</div>
      <div className="profile-activities-list" onScroll={handleScroll}>
        {activities.map((a) => (
          <ActivityItem key={a.activityId} activity={a} currentProfileName={profileName} />
        ))}
        {isFetching && (
          <div style={{ textAlign: 'center', padding: 8 }}>
            <div className="spinner spinner-sm" style={{ display: 'inline-block' }} />
          </div>
        )}
        {!isFetching && activities.length === 0 && (
          <p className="text-muted" style={{ padding: 16, textAlign: 'center', fontSize: 13 }}>
            Henüz bir aktivite bulunmuyor.
          </p>
        )}
        {!isFetching && !hasMore && activities.length > 0 && (
          <p className="text-muted" style={{ padding: 16, textAlign: 'center', fontSize: 13 }}>
            Aktivite geçmişinin sonuna geldiniz.
          </p>
        )}
      </div>
    </div>
  )
}
