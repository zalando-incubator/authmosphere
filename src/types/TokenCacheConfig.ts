import { Logger } from './';

type CacheConfig = {
  percentageLeft: number
};

type TokenCacheOptions = {
  cacheConfig?: CacheConfig,
  logger?: Logger
};

export {
  CacheConfig,
  TokenCacheOptions
};
