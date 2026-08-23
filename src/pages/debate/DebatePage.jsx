import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as signalR from '@microsoft/signalr'
import { toast } from 'react-hot-toast'
import useAuthStore from '../../store/authStore'
import './DebatePage.css'
import { Swords, Send } from 'lucide-react'

export default function DebatePage() {
  const [searchParams] = useSearchParams()
  const debateId = searchParams.get('id')
  
  const { user } = useAuthStore()
  
  const [connection, setConnection] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const [phase, setPhase] = useState('waiting_ready') // waiting_ready, ready, proponent_speech, opponent_speech, jury_evaluation, verdict
  const [proposition, setProposition] = useState('')
  const [turn, setTurn] = useState(0)
  const [totalTurns, setTotalTurns] = useState(0)
  
  const [proponent, setProponent] = useState({ id: null, name: 'Proponent', text: '' })
  const [opponent, setOpponent] = useState({ id: null, name: 'Opponent', text: '' })
  
  const [activeSpeaker, setActiveSpeaker] = useState(null)
  const [verdict, setVerdict] = useState(null)
  
  const [myInput, setMyInput] = useState('')
  const [isMyTurn, setIsMyTurn] = useState(false)
  
  const proponentScrollRef = useRef(null)
  const opponentScrollRef = useRef(null)

  useEffect(() => {
    if (!debateId) {
      toast.error('No debate ID provided.')
      return
    }

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/debate', {
        withCredentials: true // Important for cookie auth
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build()

    setConnection(newConnection)
  }, [debateId])

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          console.log('Connected to Debate Hub')
          
          connection.on('ReceiveDebateStream', (jsonStr) => {
            try {
              const data = JSON.parse(jsonStr)
              handleSignal(data)
            } catch (e) {
              console.error('Failed to parse debate signal', e)
            }
          })
          
          // Implicitly join the debate room upon connection
          connection.invoke('JoinDebate', debateId)
            .catch(err => console.error('JoinDebate error:', err))

        })
        .catch(e => console.error('Connection failed: ', e))
    }

    return () => {
      if (connection) {
        connection.off('ReceiveDebateStream')
        connection.stop()
      }
    }
  }, [connection, debateId])

  const handleSignal = (data) => {
    console.log('Signal received:', data)
    
    switch (data.type) {
      case 'phase_start':
        setPhase(data.phase)
        setTurn(data.turn ?? data.round ?? 0)
        setTotalTurns(data.totalTurns ?? data.totalRounds ?? 0)
        if (data.proposition) setProposition(data.proposition)
        
        if (data.phase === 'proponent_speech') {
          setActiveSpeaker('proponent')
          setProponent(prev => ({ ...prev, id: data.speakerId, name: data.speakerName, text: '' }))
        } else if (data.phase === 'opponent_speech') {
          setActiveSpeaker('opponent')
          setOpponent(prev => ({ ...prev, id: data.speakerId, name: data.speakerName, text: '' }))
        } else if (data.phase === 'jury_evaluation') {
          setActiveSpeaker('jury')
        }
        break
        
      case 'token':
        if (data.speaker === 'proponent') {
          setProponent(prev => ({ ...prev, text: prev.text + data.chunk }))
        } else if (data.speaker === 'opponent') {
          setOpponent(prev => ({ ...prev, text: prev.text + data.chunk }))
        }
        break
        
      case 'phase_end':
        // Overwrite text to ensure full consistency
        if (data.phase === 'proponent_speech') {
          setProponent(prev => ({ ...prev, text: data.fullContent }))
        } else if (data.phase === 'opponent_speech') {
          setOpponent(prev => ({ ...prev, text: data.fullContent }))
        }
        break
        
      case 'verdict':
        setPhase('verdict')
        setActiveSpeaker(null)
        setVerdict({
          proponentScore: data.proponentScore,
          opponentScore: data.opponentScore,
          winnerName: data.winnerName,
          winnerId: data.winnerId
        })
        break
        
      case 'turn_switch':
        // Signals that it is a user's turn
        if (data.activeSpeakerId === user?.id) {
          setIsMyTurn(true)
        } else {
          setIsMyTurn(false)
        }
        break
        
      default:
        break
    }
  }

  const handleReady = () => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      connection.invoke('Ready', debateId)
        .then(() => setIsReady(true))
        .catch(err => toast.error('Failed to send ready signal: ' + err.toString()))
    }
  }

  const handleSubmitSpeech = () => {
    if (!myInput.trim()) return
    
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      connection.invoke('SubmitSpeech', debateId, myInput)
        .then(() => {
          setMyInput('')
          setIsMyTurn(false)
        })
        .catch(err => toast.error('Failed to submit speech: ' + err.toString()))
    }
  }

  // Auto-scroll
  useEffect(() => {
    if (proponentScrollRef.current) {
      proponentScrollRef.current.scrollTop = proponentScrollRef.current.scrollHeight
    }
  }, [proponent.text])

  useEffect(() => {
    if (opponentScrollRef.current) {
      opponentScrollRef.current.scrollTop = opponentScrollRef.current.scrollHeight
    }
  }, [opponent.text])

  if (!debateId) {
    return <div className="p-8 text-center text-red-500">No debate ID specified.</div>
  }

  return (
    <div className="debate-container">
      <div className="debate-header">
        <Swords size={32} className="text-primary mb-2" />
        <h2 className="debate-proposition">
          {proposition || 'Waiting for proposition...'}
        </h2>
        <div className="debate-status">
          {phase === 'waiting_ready' && 'Waiting for participants...'}
          {phase.includes('speech') && `Turn ${turn} of ${totalTurns} • ${activeSpeaker?.toUpperCase()} SPEECH`}
          {phase === 'jury_evaluation' && 'Jury is evaluating...'}
          {phase === 'verdict' && 'Debate Concluded'}
        </div>
      </div>

      {!isReady && phase === 'waiting_ready' ? (
        <div className="ready-button-container">
          <button className="btn-ready" onClick={handleReady}>
            I'm Ready
          </button>
        </div>
      ) : (
        <>
          <div className="debate-arena">
            {/* Proponent Panel */}
            <div className={`participant-panel ${activeSpeaker === 'proponent' ? 'active-speaker' : ''}`}>
              <div className="participant-header">
                <div className="participant-avatar">P</div>
                <div className="participant-info">
                  <span className="participant-name">{proponent.name}</span>
                  <span className="participant-role">Proponent</span>
                </div>
              </div>
              <div className="participant-body" ref={proponentScrollRef}>
                <div className="speech-stream">
                  {proponent.text}
                  {activeSpeaker === 'proponent' && phase === 'proponent_speech' && (
                    <span className="blinking-cursor"></span>
                  )}
                </div>
              </div>
            </div>

            {/* Opponent Panel */}
            <div className={`participant-panel ${activeSpeaker === 'opponent' ? 'active-speaker' : ''}`}>
              <div className="participant-header">
                <div className="participant-avatar">O</div>
                <div className="participant-info">
                  <span className="participant-name">{opponent.name}</span>
                  <span className="participant-role">Opponent</span>
                </div>
              </div>
              <div className="participant-body" ref={opponentScrollRef}>
                <div className="speech-stream">
                  {opponent.text}
                  {activeSpeaker === 'opponent' && phase === 'opponent_speech' && (
                    <span className="blinking-cursor"></span>
                  )}
                </div>
              </div>
            </div>

            {/* Verdict Overlay */}
            {verdict && (
              <div className="verdict-overlay">
                <div className="verdict-title">JURY VERDICT</div>
                <div className="verdict-scores">
                  <span className={verdict.proponentScore > verdict.opponentScore ? 'text-success' : 'text-error'}>
                    {verdict.proponentScore}
                  </span>
                  <span>-</span>
                  <span className={verdict.opponentScore > verdict.proponentScore ? 'text-success' : 'text-error'}>
                    {verdict.opponentScore}
                  </span>
                </div>
                <div className="verdict-winner">
                  Winner: {verdict.winnerName}
                </div>
              </div>
            )}
          </div>

          {/* User Input Area for Human participants */}
          {isMyTurn && (
            <div className="debate-controls">
              <textarea 
                className="speech-input"
                placeholder="Type your argument..."
                value={myInput}
                onChange={(e) => setMyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmitSpeech()
                  }
                }}
              />
              <button 
                className="btn-submit-speech"
                onClick={handleSubmitSpeech}
                disabled={!myInput.trim()}
              >
                <Send size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
