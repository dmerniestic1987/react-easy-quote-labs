import type { components } from './schema';

type Schemas = components['schemas'];

export type LoginRequest = Schemas['LoginRequestDto'];
export type LoginUser = Schemas['LoginUserDto'];
export type ChangePasswordRequest = Schemas['ChangePasswordRequestDto'];

/** What the browser receives from the BFF: the JWT itself never leaves the server. */
export type SessionInfo = {
  user: LoginUser;
  /** Epoch milliseconds when the session ends, or null if unknown. */
  expiresAt: number | null;
};
