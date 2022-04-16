import { formatNumber, formatPercentage } from 'common/format';
import SPELLS from 'common/SPELLS';
import { SpellLink } from 'interface';
import Analyzer, { Options, SELECTED_PLAYER, SELECTED_PLAYER_PET } from 'parser/core/Analyzer';
import calculateEffectiveDamage from 'parser/core/calculateEffectiveDamage';
import conduitScaling from 'parser/core/conduitScaling';
import Events, { CastEvent, DamageEvent, RemoveBuffEvent, SummonEvent } from 'parser/core/Events';
import { ThresholdStyle } from 'parser/core/ParseResults';
import ConduitSpellText from 'parser/ui/ConduitSpellText';
import ItemDamageDone from 'parser/ui/ItemDamageDone';
import Statistic from 'parser/ui/Statistic';
import STATISTIC_CATEGORY from 'parser/ui/STATISTIC_CATEGORY';
import STATISTIC_ORDER from 'parser/ui/STATISTIC_ORDER';

import { ABILITIES_AFFECTED_BY_DAMAGE_INCREASES, ABILITIES_CLONED_BY_SEF } from '../../constants';

/**
 * Calculates the amount of damage that could have been added if an effect
 * had been applied.
 *
 * @param event a damage event that could have been boosted by an effect
 * @param increase the boost's added multiplier (for +20% pass 0.20)
 * @returns the amount of damage that the boost would have added if applied
 */
function calculateMissedDamage(event: DamageEvent, increase: number): number {
  const raw = (event.amount || 0) + (event.absorbed || 0);
  return raw * increase;
}

class CoordinatedOffensive extends Analyzer {
  CO_MOD = 0;
  readonly SERENITY_MOD = 0.2;
  hasSerenity = false;
  fixateUptime = 0;
  fixateActivateTimestamp = -1;
  damageIncrease = 0;
  missedDamageIncrease = 0;
  CO_Active: boolean = false;
  cloneIDs = new Set();
  cloneMap: Map<number, number> = new Map<number, number>();

  constructor(options: Options) {
    super(options);
    const conduitRank = this.selectedCombatant.conduitRankBySpellID(
      SPELLS.COORDINATED_OFFENSIVE.id,
    );
    if (!conduitRank) {
      this.active = false;
      return;
    }

    this.CO_MOD = conduitScaling(0.088, conduitRank);

    this.hasSerenity = this.selectedCombatant.hasTalent(SPELLS.SERENITY_TALENT.id);

    if (!this.hasSerenity) {
      //summon events (need to track this to get melees)
      this.addEventListener(
        Events.removebuff.by(SELECTED_PLAYER).spell(SPELLS.STORM_EARTH_AND_FIRE_CAST),
        this.CO_Deactivator,
      );
      this.addEventListener(
        Events.cast.by(SELECTED_PLAYER).spell(SPELLS.STORM_EARTH_AND_FIRE_FIXATE),
        this.CO_Activator,
      );
      this.addEventListener(
        Events.summon
          .by(SELECTED_PLAYER)
          .spell([
            SPELLS.STORM_EARTH_AND_FIRE_EARTH_SPIRIT,
            SPELLS.STORM_EARTH_AND_FIRE_FIRE_SPIRIT,
          ]),
        this.trackSummons,
      );
      this.addEventListener(
        Events.damage.by(SELECTED_PLAYER_PET).spell(SPELLS.MELEE),
        this.handleMelee,
      );
      this.addEventListener(
        Events.damage.by(SELECTED_PLAYER_PET).spell(ABILITIES_CLONED_BY_SEF),
        this.onSEFDamage,
      );
    } else {
      this.addEventListener(
        Events.damage.by(SELECTED_PLAYER).spell(ABILITIES_AFFECTED_BY_DAMAGE_INCREASES),
        this.onSerenityDamage,
      );
    }
  }
  CO_Deactivator(event: RemoveBuffEvent) {
    this.fixateUptime = this.fixateUptime + (event.timestamp - this.fixateActivateTimestamp);
    this.CO_Active = false;
  }
  CO_Activator(event: CastEvent) {
    // Don't want to overwrite the fixate timestamp if we're already active
    if (!this.CO_Active) {
      this.fixateActivateTimestamp = event.timestamp;
      this.CO_Active = true;
    }
  }
  trackSummons(event: SummonEvent) {
    this.cloneMap.set(event.targetID, event.ability.guid);
  }
  handleMelee(event: DamageEvent) {
    //if we don't know who its from then we can't add it
    if (!event.sourceID) {
      return;
    }
    const id: number = event.sourceID;
    const cloneType: number | undefined = this.cloneMap.get(id);
    if (cloneType === undefined) {
      return;
    }

    if (
      cloneType === SPELLS.STORM_EARTH_AND_FIRE_FIRE_SPIRIT.id ||
      cloneType === SPELLS.STORM_EARTH_AND_FIRE_EARTH_SPIRIT.id
    ) {
      this.onSEFDamage(event);
    }
  }

  onSEFDamage(event: DamageEvent) {
    if (this.CO_Active) {
      this.damageIncrease += calculateEffectiveDamage(event, this.CO_MOD);
    } else {
      this.missedDamageIncrease += calculateMissedDamage(event, this.CO_MOD);
    }
  }
  onSerenityDamage(event: DamageEvent) {
    if (!this.selectedCombatant.hasBuff(SPELLS.SERENITY_TALENT.id)) {
      return;
    }
    this.damageIncrease +=
      calculateEffectiveDamage(event, this.CO_MOD + this.SERENITY_MOD) -
      calculateEffectiveDamage(event, this.SERENITY_MOD);
  }

  /** How much of the active SEF time that has been fixated */
  get uptime() {
    return (
      this.fixateUptime / this.selectedCombatant.getBuffUptime(SPELLS.STORM_EARTH_AND_FIRE_CAST.id)
    );
  }

  get fixateUptimeSuggestionThreshold() {
    return {
      actual: this.uptime,
      isLessThan: {
        minor: 0.9,
        average: 0.75,
        major: 0.5,
      },
      style: ThresholdStyle.PERCENTAGE,
    };
  }

  statistic() {
    const tooltip = this.hasSerenity ? (
      <>
        The {formatPercentage(this.CO_MOD, 1)}% increase to{' '}
        <SpellLink id={SPELLS.SERENITY_TALENT.id} /> from{' '}
        <SpellLink id={SPELLS.COORDINATED_OFFENSIVE.id} /> was worth{' '}
        {formatNumber(this.damageIncrease)} raw damage.
      </>
    ) : (
      <>
        The {formatPercentage(this.CO_MOD, 1)}% damage increase during the{' '}
        {formatPercentage(this.uptime, 0)}% of <SpellLink id={SPELLS.STORM_EARTH_AND_FIRE.id} />{' '}
        that the spirits was fixated contributed ~{formatNumber(this.damageIncrease)} raw damage.
      </>
    );

    return (
      <Statistic
        position={STATISTIC_ORDER.OPTIONAL(13)}
        size="flexible"
        category={STATISTIC_CATEGORY.COVENANTS}
        tooltip={tooltip}
      >
        <ConduitSpellText spellId={SPELLS.COORDINATED_OFFENSIVE.id}>
          <ItemDamageDone amount={this.damageIncrease} />
        </ConduitSpellText>
      </Statistic>
    );
  }
}

export default CoordinatedOffensive;
