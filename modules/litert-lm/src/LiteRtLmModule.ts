import { requireNativeModule } from 'expo-modules-core';
import type { LiteRtLmNativeModule } from './LiteRtLm.types';

export default requireNativeModule<LiteRtLmNativeModule>('LiteRtLm');
