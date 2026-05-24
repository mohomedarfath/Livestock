import { env } from '../../lib/env'
import { platformRepository } from './platformRepository'

export function ensureLegacySeed() {
  if (env.enableLegacyDemo) {
    platformRepository.ensureDemoPlatform()
  }
}
