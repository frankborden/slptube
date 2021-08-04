import type { Character } from '../common';
import { Vector } from '../vector';
import type { ActionName } from '../animations/actions';
export const peach: Character = {
  scale: 1.15,
  // shieldOffset: new Vector(5 / 4.5, 34 / 4.5),
  shieldOffset: new Vector(5 / 4.5, 34 / 4.5), // guess

  shieldSize: 1.15 * 11.875,
  animationMap: new Map<ActionName, string>([
    ['Rebirth', 'Entry'],
    ['RebirthWait', 'Entry'],
    ['RunDirect', ''],
    ['KneeBend', 'Landing'],
    ['LandingFallSpecial', 'Landing'],
    ['LightThrowF4', 'LightThrowF'],
    ['LightThrowB4', 'LightThrowB'],
    ['LightThrowHi4', 'LightThrowHi'],
    ['LightThrowLw4', 'LightThrowLw'],
    ['LightThrowAirF4', 'LightThrowAirF'],
    ['LightThrowAirB4', 'LightThrowAirB'],
    ['LightThrowAirHi4', 'LightThrowAirHi'],
    ['LightThrowAirLw4', 'LightThrowAirLw'],
    ['HeavyThrowF4', ''],
    ['HeavyThrowB4', ''],
    ['HeavyThrowHi4', ''],
    ['HeavyThrowLw4', ''],
    ['SwordSwing1', 'Swing1'],
    ['SwordSwing3', 'Swing3'],
    ['SwordSwing4', 'Swing4'],
    ['SwordSwingDash', 'SwingDash'],
    ['LiftWait', ''],
    ['LiftWalk1', ''],
    ['LiftWalk2', ''],
    ['AttackS3S', 'AttackS3'],
    ['AttackS4S', 'AttackS4'],
    ['LiftTurn', ''],
    ['GuardSetOff', 'GuardDamage'],
    ['GuardReflect', 'Guard'],
    ['ShieldBreakFly', ''],
    ['ShieldBreakFall', ''],
    ['ShieldBreakDownU', ''],
    ['ShieldBreakDownD', ''],
    ['ShieldBreakStandU', ''],
    ['ShieldBreakStandD', ''],
    ['CatchPull', ''],
    ['CatchDashPull', ''],
    ['CaptureNeck', ''],
    ['CaptureFoot', ''],
    ['Escape', 'EscapeN'],
    ['ReboundStop', ''],
    ['ThrownF', ''],
    ['ThrownB', ''],
    ['ThrownHi', ''],
    ['ThrownLw', ''],
    ['ThrownLwWomen', ''],
    ['FlyReflectWall', 'WallDamage'],
    ['FlyReflectCeil', ''],
    ['AppealR', 'AppealR'],
    ['AppealL', 'AppealL'],
    ['ShoulderedWait', ''],
    ['ShoulderedWalkSlow', ''],
    ['ShoulderedWalkMiddle', ''],
    ['ShoulderedWalkFast', ''],
    ['ShoulderedTurn', ''],
    ['ThrownFF', ''],
    ['ThrownFB', ''],
    ['ThrownFHi', ''],
    ['ThrownFLw', ''],
    ['CaptureCaptain', ''],
    ['CaptureYoshi', ''],
    ['YoshiEgg', ''],
    ['CaptureKoopa', ''],
    ['CaptureDamageKoopa', ''],
    ['CaptureWaitKoopa', ''],
    ['ThrownKoopaF', ''],
    ['ThrownKoopaB', ''],
    ['CaptureKoopaAir', ''],
    ['CaptureDamageKoopaAir', ''],
    ['CaptureWaitKoopaAir', ''],
    ['ThrownKoopaAirF', ''],
    ['ThrownKoopaAirB', ''],
    ['CaptureKirby', ''],
    ['CaptureWaitKirby', ''],
    ['ThrownKirbyStar', ''],
    ['ThrownCopyStar', ''],
    ['ThrownKirby', ''],
    ['BarrelWait', ''],
    ['Bury', ''],
    ['BuryWait', ''],
    ['BuryJump', ''],
    ['DamageSong', ''],
    ['DamageSongWait', ''],
    ['DamageSongRv', ''],
    ['DamageBind', ''],
    ['CaptureMewtwo', ''],
    ['CaptureMewtwoAir', ''],
    ['ThrownMewtwo', ''],
    ['ThrownMewtwoAir', ''],
    ['EntryStart', 'Rebirth'],
    ['EntryEnd', 'Entry'],
    ['DamageIce', ''],
    ['DamageIceJump', ''],
    ['CaptureKirbyYoshi', ''],
    ['KirbyYoshiEgg', ''],
    ['CaptureLeadead', ''],
    ['CaptureLikelike', ''],
    ['DownReflect', ''],
    ['Wait', 'Wait1'],
    ['SquatWait1', 'SquatWait'],
    ['SquatWait2', 'SquatWait'],
    ['AttackS4Hold', ''],
    ['DamageElec', ''],
    ['CliffWait1', 'CliffWait'],
    ['CliffWait2', 'CliffWait'],
    ['SlipDown', ''],
    ['Slip', ''],
    ['SlipTurn', ''],
    ['SlipDash', ''],
    ['SlipWait', ''],
    ['SlipStand', ''],
    ['SlipAttack', ''],
    ['SlipEscapeF', ''],
    ['SlipEscapeB', ''],
    ['CaptureKoopaHit', ''],
    ['ThrownKoopaEndF', ''],
    ['ThrownKoopaEndB', ''],
    ['CaptureKoopaAirHit', ''],
    ['ThrownKoopaAirEndF', ''],
    ['ThrownKoopaAirEndB', ''],
    ['ThrownKirbyDrinkSShot', ''],
    ['ThrownKirbySpitSShot', ''],
  ]),
  specialsMap: new Map<number, string>([
    [341, 'Fuwafuwa'],
    [342, 'FallF'],
    [343, 'FallB'],
    [344, 'AttackAirN'],
    [345, 'AttackAirF'],
    [346, 'AttackAirB'],
    [347, 'AttackAirHi'],
    [348, 'AttackAirLw'],
    [349, 'AttackS4'], // Golf
    [350, 'AttackS4'], // Frying
    [351, 'AttackS4'], // Tennis
    [352, 'SpecialN'],
    [353, 'SpecialAirN'],
    [354, 'SpecialSStart'],
    [355, 'SpecialSEnd'],
    [356, 'Unsupported'],
    [357, 'SpecialAirSStart'],
    [358, 'SpecialAirSEnd'],
    [359, 'SpecialAirS'],
    [360, 'SpecialSJump'],
    [361, 'SpecialHiStart'],
    [362, 'SpecialHiEnd'],
    [363, 'SpecialAirHiStart'],
    [364, 'SpecialAirHiEnd'],
    [365, 'SpecialLw'],
    [366, 'SpecialLwHit'],
    [367, 'SpecialAirLw'],
    [368, 'SpecialAirLwHit'],
    [369, 'ItemParasolOpen'],
    [370, 'ItemParasolFall'],
  ]),
};