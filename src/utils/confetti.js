import confetti from 'canvas-confetti'

/**
 * Modal kapandıktan sonra gecikmeyle (varsayılan 200ms) süzülen, ağır çekim tadında konfeti patlatır.
 */
export const triggerConfetti = (delay = 200) => {
  setTimeout(() => {
    confetti({
      particleCount: 90,
      spread: 85,
      origin: { y: 0.6 },
      gravity: 0.6,       // Yerçekimini düşürerek daha süzülen/ağır çekim hissi verir
      startVelocity: 28,  // Başlangıç hızı daha yumuşak
      ticks: 300          // Ekranda kalma süresini artırır
    })
  }, delay)
}
