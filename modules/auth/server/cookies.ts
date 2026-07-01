export const ACCESS_TOKEN_COOKIE = "saut_access_token";
export const REFRESH_TOKEN_COOKIE = "saut_refresh_token";
export const ACCOUNT_ID_COOKIE = "saut_account_id";
export const SESSION_ID_COOKIE = "saut_session_id";
export const ACTOR_TYPE_COOKIE = "saut_actor_type";
export const EXPIRES_AT_COOKIE = "saut_expires_at";
export const GOOGLE_RETURN_TO_COOKIE = "saut_google_return_to";

export const AUTH_COOKIE_NAMES = [
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ACCOUNT_ID_COOKIE,
  SESSION_ID_COOKIE,
  ACTOR_TYPE_COOKIE,
  EXPIRES_AT_COOKIE,
] as const;
