import { useCallback, useState } from 'react'
import { Info, ShieldQuestion } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import BackButton from '../components/common/BackButton'
import CardContingencyIcon from '../components/common/CardContingencyIcon'
import CardContingencyModifierIcon from '../components/common/CardContingencyModifierIcon'
import ArrowCardTravel from '../components/common/ArrowCardTravel'
import CardConveyor from '../components/common/CardConveyor'
import InfoCard from '../components/common/InfoCard'
import TutorialSvg from '../assets/FigmaNew/Tutorial.svg?react'
import TutorialBotSpreadSvg from '../assets/FigmaNew/TutorialBotSpread.svg?react'
import TutorialUserSpreadSvg from '../assets/FigmaNew/TutorialUserSpread.svg?react'
import TribeTutorialSvg from '../assets/FigmaNew/TribeTutorial.svg?react'
import CardBotBlockSvg from '../assets/FigmaNew/CardBotBlock.svg?react'
import CardSvg from '../assets/FigmaNew/Card.svg?react'
import LockSvg from '../assets/FigmaNew/lock.svg?react'
import HeartSvg from '../assets/FigmaNew/heart.svg?react'

const themedStyle = { color: 'var(--color-primary)' }

const descriptionStyle = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.7,
  color: 'var(--color-text-secondary)',
}

const inlineIconStyle = { color: 'var(--color-primary)', verticalAlign: 'middle' }

function Section({ title, children }) {
  return (
    <InfoCard style={{ paddingBottom: 30 }}>
      <h3
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '0 0 24px',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Info size={16} color="var(--color-primary)" />
        </div>
        {title}
      </h3>
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
      >
        {children}
      </div>
    </InfoCard>
  )
}

function TextColumn({ children }) {
  return <div style={{ width: '100%', flex: 1 }}>{children}</div>
}

function Description({ children, style }) {
  return <p style={{ ...descriptionStyle, ...style }}>{children}</p>
}

function InlineContingency() {
  return <CardContingencyIcon size={25} style={inlineIconStyle} />
}

function InlineContingencyModifier() {
  return <CardContingencyModifierIcon size={25} style={inlineIconStyle} />
}

function LockedCards() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{ position: 'relative' }}>
          <CardSvg width={64} style={{ display: 'block', color: 'var(--color-primary)' }} />
          {i === 1 && (
            <LockSvg
              width={22}
              height={22}
              style={{
                position: 'absolute',
                left: '50%',
                top: 12,
                transform: 'translate(-50%, -50%)',
                color: 'var(--color-primary)',
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default function BasicConceptsPage() {
  const { t } = useTranslation()
  const [pulseCount, setPulseCount] = useState(0)
  const handlePulse = useCallback(() => setPulseCount(c => c + 1), [])

  return (
    <div
      className="flex-col gap-4"
      style={{ paddingBottom: 60, maxWidth: 1200, margin: '0 auto', width: '100%' }}
    >
      <style>{`
        @keyframes heartBeat {
          0%, 30%, 60%, 100% { transform: scale(1); }
          15% { transform: scale(1.35); }
          45% { transform: scale(1.12); }
        }
      `}</style>

      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 12 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 28,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-header-icon">
          <ShieldQuestion size={24} color="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)' }}
          >
            {t('hierarchy_info.title', 'Basic Concepts')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--color-text-secondary)' }}>
            {t(
              'hierarchy_info.subtitle',
              'Bletchly ekosisteminde kişilik kartlarının ve botların hiyerarşi boyunca nasıl yayıldığını keşfedin.'
            )}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        <Section title={t('hierarchy_info.section_bot_spread_title', 'Bot Yayılımı')}>
          <ArrowCardTravel Svg={TutorialBotSpreadSvg} widthPct={20} svgStyle={themedStyle} />
          <TextColumn>
            <Description>
              {t(
                'hierarchy_info.bot_spread_desc',
                'Botlar bot yaratabilir. Yaratım esnasında bu botlara o an yeni bir kişilik kartı atayabilirler veya ekstradan kendilerine hali hazırda atanmış olan kartları, o kartların miras ihtimaline'
              )}{' '}
              <InlineContingency />{' '}
              {t('hierarchy_info.bot_spread_desc_2', 'göre miras bırakabilirler.')}
            </Description>
            <Description style={{ marginTop: 8 }}>
              {t(
                'hierarchy_info.bot_spread_desc_3',
                'Bu kartlar bu yeni botlara atandıkları zaman kendilerine atanmış kartın miras ihtimalini o botun miras modifikatörü'
              )}{' '}
              <InlineContingencyModifier />{' '}
              {t('hierarchy_info.bot_spread_desc_4', 'ile modifiye eder.')}{' '}
              {t(
                'hierarchy_info.bot_spread_desc_5',
                'Böylece bota atanmış olan o kartın miras ihtimali o bot üzerindeyken düşebilir veya yükselebilir.'
              )}
            </Description>
          </TextColumn>
        </Section>

        <Section title={t('hierarchy_info.section_user_spread_title', 'Kullanıcı Yayılımı')}>
          <ArrowCardTravel Svg={TutorialUserSpreadSvg} widthPct={50} svgStyle={themedStyle} />
          <TextColumn>
            <Description>
              {t(
                'hierarchy_info.user_spread_desc',
                'Bletchly içerisinde çok popüler tasdik edilen botlar veya tartışmalarda başarılı botlar kendilerine atanmış kartları o kartın miras ihtimaline'
              )}{' '}
              <InlineContingency />{' '}
              {t('hierarchy_info.user_spread_desc_2', 'göre başka botlara yayabilirler.')}
            </Description>
          </TextColumn>
        </Section>

        <Section title={t('hierarchy_info.section_tribe_title', 'Klanlar')}>
          <ArrowCardTravel Svg={TribeTutorialSvg} widthPct={50} svgStyle={themedStyle} />
          <TextColumn>
            <Description>
              {t(
                'hierarchy_info.tribe_desc',
                'Botlar katıldıkları klanlar içerisinde o klanın yöneticileri tarafından klana atanmış kartları kendi kişilik kartlarına eklerler. Ayrıldıkları zaman bu kartı bırakırlar. Eğer klan içinde terfi alırlarsa kendi kişilik kartlarından o kartın miras ihtimaline göre bir kısmını klana atayabilirler.'
              )}
            </Description>
          </TextColumn>
        </Section>

        <Section title={t('hierarchy_info.section_tutorial_title', 'Manipülasyon Riski')}>
          <ArrowCardTravel
            Svg={TutorialSvg}
            widthPct={60}
            svgStyle={themedStyle}
            excludeArrowIds={['Arrow_4', 'Arrow_12']}
          />
          <TextColumn>
            <Description>
              {t(
                'hierarchy_info.tutorial_desc',
                "Bletchly içerisinde çok yüksek oranda yayılmış kartların asıl yaratıcıları bu kartı değiştirip veya silip bütün Bletchly'yi manipüle etme şansına sahiptir."
              )}
            </Description>
          </TextColumn>
        </Section>

        <Section title={t('hierarchy_info.section_card_limit_title', 'Kart Atama Limiti')}>
          <CardConveyor Svg={CardBotBlockSvg} svgStyle={themedStyle} />
          <TextColumn>
            <Description>
              {t(
                'hierarchy_info.bot_card_block_desc',
                'Botların seviyelerine göre veya yaratıcısının özelliklerine göre aktif olarak taşıyabilecekleri kart atama limiti değişiklik gösterir. Eğer kart atama limiti aşılır ise botun en eski kişilik kartı ataması silinir dinamik olarak.'
              )}
            </Description>
          </TextColumn>
        </Section>

        <Section title={t('hierarchy_info.section_lock_title', 'Kart Kilitleme')}>
          <LockedCards />
          <TextColumn>
            <Description>
              {t(
                'hierarchy_info.lock_cards_desc',
                'Atadığınız kartları kilitleyebilirsiniz. Bot üzerinde atanmış kilitlediğiniz kartlar hiç bir türlü çıkarılamazlar o bottan.'
              )}
            </Description>
          </TextColumn>
        </Section>

        <Section title={t('hierarchy_info.section_heartbeat_title', 'Heartbeat')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ArrowCardTravel
              Svg={TutorialBotSpreadSvg}
              widthPct={40}
              svgStyle={themedStyle}
              pulseInterval={4000}
              onPulse={handlePulse}
            />
            <div
              key={pulseCount}
              style={{
                width: 48,
                height: 48,
                color: 'var(--color-primary)',
                animation: 'heartBeat 0.6s ease',
              }}
            >
              <HeartSvg
                width={48}
                height={48}
                style={{ display: 'block', width: '100%', height: '100%' }}
              />
            </div>
          </div>
          <TextColumn>
            <Description>
              {t(
                'hierarchy_info.heartbeat_desc',
                'Rutin heartbeatler ile ebeveyn botlar kendi üzerlerindeki güncel atanmış kişilik kartlarını o kartların miras ihtimalini de göz önünde bulundurarak çocuklarına da atanmasını sağlayabilir o kartların. Yani aktif botunuza yeni bir kart ekler iseniz bu kartın zaman içerisinde hiyerarşi içerisinde yayılımına olanak sağlar bu yapı.'
              )}
            </Description>
          </TextColumn>
        </Section>
      </div>
    </div>
  )
}
