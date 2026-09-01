import { useMemo } from 'react'
import { Bot as BotIcon } from 'lucide-react'
import AngryBotIcon from './AngryBotIcon'
import LazyBotIcon from './LazyBotIcon'
import SwordIcon from './SwordIcon'
import ShieldIcon from './ShieldIcon'
import useUIStore from '../../store/uiStore'

/**
 * Profil kartının arkasında, debate sahnesiyle aynı prensipte
 * rastgele dağılımlı, hafif blur'lu ve silik duran bot ikonları.
 */
export default function AmbientBots() {
  const isActive = useUIStore((s) => s.isBotsAmbience)

  const bots = useMemo(() => {
    return Array.from({ length: 55 }, (_, i) => {
      const r = Math.random()
      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 14 + Math.random() * 18,
        rotation: Math.random() * 360,
        opacity: 0.45 + Math.random() * 0.35,
        botType: r < 0.3 ? 'angry' : r < 0.55 ? 'lazy' : 'normal',
        hasSword: Math.random() < 0.18,
        hasShield: Math.random() < 0.18,
        delay: Math.random() * 5,
        duration: 2 + Math.random() * 3,
      }
    })
  }, [])

  if (!isActive) return null

  return (
    <div
      className="ambient-bots"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: 0.5,
        filter: 'blur(1px)',
      }}
    >
      <style>{`
        @keyframes ambientBotFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
      {bots.map((bot) => (
        <div
          key={bot.id}
          style={{
            position: 'absolute',
            left: `${bot.x}%`,
            top: `${bot.y}%`,
            transform: `translate(-50%, -50%) rotate(${bot.rotation}deg)`,
            opacity: bot.opacity,
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: `ambientBotFloat ${bot.duration}s ease-in-out ${bot.delay}s infinite`,
            }}
          >
            {bot.hasSword && (
              <div
                style={{
                  position: 'absolute',
                  right: '60%',
                  bottom: '-10%',
                  transform: 'rotate(-25deg)',
                  zIndex: 2,
                  opacity: 0.9,
                }}
              >
                <SwordIcon size={bot.size * 0.7} />
              </div>
            )}
            {bot.botType === 'angry' ? (
              <AngryBotIcon size={bot.size} />
            ) : bot.botType === 'lazy' ? (
              <LazyBotIcon size={bot.size} />
            ) : (
              <BotIcon size={bot.size} />
            )}
            {bot.hasShield && (
              <div
                style={{
                  position: 'absolute',
                  left: '60%',
                  bottom: '-10%',
                  transform: 'rotate(25deg)',
                  zIndex: 2,
                  opacity: 0.9,
                }}
              >
                <ShieldIcon size={bot.size * 0.7} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
