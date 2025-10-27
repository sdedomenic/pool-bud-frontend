import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@api/useAuth'

export default function UserMenu() {
  const { user, signOut } = useAuth()
  const nav = useNavigate()
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleLogout() {
    await signOut()
    nav('/')
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="btn secondary user-menu__trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        {user?.email ?? 'Account'}
        <span aria-hidden="true" className="user-menu__caret">▾</span>
      </button>
      {open && (
        <div className="user-menu__panel">
          <button
            type="button"
            className="user-menu__item"
            onClick={() => {
              setOpen(false)
              nav('/app/account')
            }}
          >
            My Account
          </button>
          <button type="button" className="user-menu__item" onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
