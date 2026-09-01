import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as signalR from '@microsoft/signalr'
import { toast } from 'react-hot-toast'
import useAuthStore from '../store/authStore'

export function useInvitationHub() {
  const navigate = useNavigate()
  const { isLoggedIn, actorId } = useAuthStore()
  const [incomingInvitation, setIncomingInvitation] = useState(null)
  const connectionRef = useRef(null)

  useEffect(() => {
    if (!isLoggedIn || !actorId) {
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {})
        connectionRef.current = null
      }
      return
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/invitation', {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build()

    connectionRef.current = connection

    connection.on('ReceiveInvitation', (rawMessage) => {
      try {
        const data = typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage
        if (!data) return

        if (data.type === 'debate_invitation') {
          setIncomingInvitation(data)
        } else if (data.type === 'debate_accepted') {
          toast.success(
            `🏆 ${data.opponentName || 'Rakip'} münazara davetini kabul etti! Arenaya aktarılıyorsunuz...`,
            { duration: 5000 }
          )
          if (data.debateId) {
            navigate(`/debate?id=${data.debateId}`)
          }
        } else if (data.type === 'debate_declined') {
          toast.error('❌ Rakip münazara davetini reddetti.', { duration: 5000 })
        }
      } catch (err) {
        console.error('Error handling invitation signal:', err)
      }
    })

    connection
      .start()
      .then(() => {
        connection.invoke('JoinUserRoom', actorId.toString()).catch(() => {})
      })
      .catch((err) => {
        console.warn('Could not connect to InvitationHub:', err.message)
      })

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {})
        connectionRef.current = null
      }
    }
  }, [isLoggedIn, actorId, navigate])

  return {
    incomingInvitation,
    closeInvitation: () => setIncomingInvitation(null),
  }
}
