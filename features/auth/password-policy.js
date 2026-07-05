export const AUTH_PASSWORD_RULE_TEXT = '* 至少 8 位，且包含字母和数字'

const AUTH_PASSWORD_MIN_LENGTH = 8
const AUTH_PASSWORD_LETTER_PATTERN = /[A-Za-z]/
const AUTH_PASSWORD_NUMBER_PATTERN = /\d/

export const isAuthPasswordValid = (password) => (
  password.length >= AUTH_PASSWORD_MIN_LENGTH &&
  AUTH_PASSWORD_LETTER_PATTERN.test(password) &&
  AUTH_PASSWORD_NUMBER_PATTERN.test(password)
)
