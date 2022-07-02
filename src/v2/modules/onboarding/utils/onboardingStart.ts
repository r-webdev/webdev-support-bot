import { get, upsert } from '../../../cache';
import { GenericCacheType } from '../../../cache/model';
import { SERVER_ID } from '../../../env';

interface OnboardingStartCache extends GenericCacheType {
  meta: {
    onboardingStart: number;
  };
}

const _getOnboardingCache = (): Promise<OnboardingStartCache> =>
  get({
    guild: SERVER_ID,
    type: 'ONBOARDING_START',
    user: '',
  }) as unknown as Promise<OnboardingStartCache>;

export const getOnboardingStart = async (): Promise<number | undefined> =>
  (await _getOnboardingCache())?.meta.onboardingStart;

export const setOnboardingStart = () =>
  upsert({
    expiresAt: Number.MAX_SAFE_INTEGER,
    guild: SERVER_ID,
    type: 'ONBOARDING_START',
    user: '',
    meta: {
      onboardingStart: Date.now(),
    },
  }) as unknown as Promise<OnboardingStartCache>;;
