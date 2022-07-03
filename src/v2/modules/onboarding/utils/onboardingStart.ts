import { get, upsert } from '../../../cache/index.js';
import type { GenericCacheType } from '../../../cache/model.js';
import { SERVER_ID } from '../../../env.js';

type OnboardingStartCache = {
  meta: {
    onboardingStart: number;
  };
} & GenericCacheType;

const _getOnboardingCache = (): Promise<OnboardingStartCache> =>
  get({
    guild: SERVER_ID,
    type: 'ONBOARDING_START',
    user: '',
  }) as unknown as Promise<OnboardingStartCache>;

export const getOnboardingStart = async (): Promise<number | undefined> => {
  const cache = await _getOnboardingCache();

  return cache?.meta.onboardingStart;
};

export const setOnboardingStart = (): Promise<OnboardingStartCache> =>
  upsert({
    expiresAt: Number.MAX_SAFE_INTEGER,
    guild: SERVER_ID,
    type: 'ONBOARDING_START',
    user: '',
    meta: {
      onboardingStart: Date.now(),
    },
  }) as unknown as Promise<OnboardingStartCache>;
