import { useApp } from '../context/AppContext'

export default function FreezeFAB() {
  const { isGlobalFrozen, startFreezeFlow, unfreezeAll } = useApp()

  const handleClick = () => {
    if (isGlobalFrozen) {
      // In real app this would require re-auth / OTP
      if (window.confirm('Unfreeze all accounts? (Simulated verification)')) {
        unfreezeAll()
      }
    } else {
      startFreezeFlow()
    }
  }

  return (
    <button
      className={`freeze-fab ${isGlobalFrozen ? 'frozen' : ''}`}
      onClick={handleClick}
      title={isGlobalFrozen ? 'Unfreeze Accounts' : 'One-Tap Freeze'}
      aria-label={isGlobalFrozen ? 'Unfreeze all accounts' : 'Emergency freeze all accounts'}
    >
      {isGlobalFrozen ? '🔓' : '🔒'}
    </button>
  )
}
