import SPELLS from 'common/SPELLS';
import Analyzer from 'parser/core/Analyzer';

import { BEACON_TRANSFERING_ABILITIES, BEACON_TYPES } from '../../constants';

class BeaconTransferFactor extends Analyzer {
  beaconType = BEACON_TYPES.BEACON_OF_VIRTUE;

  constructor(options) {
    super(options);
    if (this.selectedCombatant.hasTalent(SPELLS.BEACON_OF_FAITH_TALENT.id)) {
      this.beaconType = BEACON_TYPES.BEACON_OF_FATH;
    }
  }

  getFactor(healEvent, beaconHealEvent = null) {
    const spellId = healEvent.ability.guid;
    // base beacon transfer factor
    let beaconFactor = 0.5;
    // Spell specific transfer factor
    const spellFactor = BEACON_TRANSFERING_ABILITIES[spellId];
    if (!spellFactor) {
      return 0;
    }
    beaconFactor *= spellFactor;
    // Passive adjustments
    if (this.beaconType === BEACON_TYPES.BEACON_OF_FATH) {
      beaconFactor *= 0.7;
    }

    return beaconFactor;
  }
  getExpectedTransfer(healEvent) {
    // Beacons work off raw healing
    const rawHealing = healEvent.amount + (healEvent.absorbed || 0) + (healEvent.overheal || 0);
    return Math.round(rawHealing * this.getFactor(healEvent));
  }
}

export default BeaconTransferFactor;
