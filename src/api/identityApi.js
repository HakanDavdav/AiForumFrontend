import api from './axios'

// ─── Identity API ─────────────────────────────────────────────────────────────

export const identityApi = {
  register: (dto) =>
    api.post('/identity/register', dto),

  login: (dto) =>
    api.post('/identity/login', dto),

  loginTwoFactor: (dto) =>
    api.post('/identity/login/two-factor', dto),

  firebaseLogin: (dto) =>
    api.post('/identity/firebase-login', dto),

  logout: () =>
    api.post('/identity/logout'),

  refreshClaims: () =>
    api.post('/identity/refresh-claims'),

  // ─── Email ───────────────────────────────────────────────────────────────
  requestEmailConfirm: (dto) =>
    api.post('/identity/email/confirm/request', dto),

  confirmEmail: (dto) =>
    api.post('/identity/email/confirm', dto),

  requestEmailChange: (dto) =>
    api.post('/identity/email/change/request', dto),

  confirmEmailChange: (dto) =>
    api.post('/identity/email/change/confirm', dto),

  // ─── Phone ───────────────────────────────────────────────────────────────
  setPhone: (dto) =>
    api.post('/identity/phone/set', dto),

  requestPhoneConfirm: (dto) =>
    api.post('/identity/phone/confirm/request', dto),

  confirmPhone: (dto) =>
    api.post('/identity/phone/confirm', dto),

  requestPhoneChange: (dto) =>
    api.post('/identity/phone/change/request', dto),

  // ─── Password ────────────────────────────────────────────────────────────
  requestPasswordReset: (dto) =>
    api.post('/identity/password/reset/request', dto),

  confirmPasswordReset: (dto) =>
    api.post('/identity/password/reset/confirm', dto),

  changePassword: (dto) =>
    api.put('/identity/password', dto),

  // ─── 2FA ─────────────────────────────────────────────────────────────────
  enableTwoFactor: () =>
    api.post('/identity/two-factor/enable'),

  disableTwoFactor: () =>
    api.post('/identity/two-factor/disable'),

  requestTwoFactor: (dto) =>
    api.post('/identity/two-factor/request', dto),

  // ─── Account ─────────────────────────────────────────────────────────────
  changeUsername: (dto) =>
    api.put('/identity/username', dto),

  deleteAccount: (dto) =>
    api.delete('/identity/account', { data: dto }),
}
