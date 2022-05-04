import { max, modulo } from "rambda";
import { createMemo, createResource, Show } from "solid-js";
import { CharacterAnimations, fetchAnimations } from "./animationCache";
import { actionMapByInternalId } from "./characters";
import {
  actionNameById,
  characterNameByExternalId,
  characterNameByInternalId,
} from "../common/ids";
import { state } from "../state";
import { PlayerUpdate } from "../common/types";
import { Character } from "./characters/character";

interface RenderData {
  // main render
  path?: string;
  innerColor: string;
  outerColor: string;
  transforms: string[];

  // shield/shine renders
  animationName: string;
  position: [number, number];
  characterData: Character;
}

// TODO: Nana
export function Player(props: { player: number }) {
  const player = createMemo(() =>
    getPlayerOnFrame(props.player, state.frame())
  );
  const playerSettings = createMemo(
    () => state.replayData()!.settings.playerSettings[props.player]
  );
  const adjustedExternalCharacterId = createMemo(() =>
    adjustExternalCharacterId(
      playerSettings().externalCharacterId,
      player().state.internalCharacterId
    )
  );
  const [animations] = createResource(adjustedExternalCharacterId, () =>
    fetchAnimations(adjustedExternalCharacterId())
  );
  const renderData = createMemo(() =>
    computeRenderData(props.player, player(), animations())
  );

  return (
    <>
      <Show when={animations()}>
        <path
          transform={renderData().transforms.join(" ")}
          d={renderData().path}
          fill={renderData().innerColor}
          stroke-width={2}
          stroke={renderData().outerColor}
        ></path>
        <Shield renderData={renderData()} playerUpdate={player()} />
        <Shine renderData={renderData()} playerUpdate={player()} />
      </Show>
    </>
  );
}

export function Shield(props: {
  renderData: RenderData;
  playerUpdate: PlayerUpdate;
}) {
  // [0,60]
  const shieldHealth = createMemo(() => props.playerUpdate.state.shieldSize);
  // [0,1]. If 0 is received, set to 1 because user may have released shield
  // during a Guard-related animation. As an example, a shield must stay active
  // for 8 frames minimum before it is dropped even if the player releases the
  // trigger early.
  // For GuardDamage the shield strength is fixed and ignores trigger updates,
  // so we must walk back to the first frame of stun and read trigger there.
  const triggerStrength = createMemo(() =>
    props.renderData.animationName === "GuardDamage"
      ? getPlayerOnFrame(
          props.playerUpdate.playerIndex,
          getStartOfAction(
            props.playerUpdate.playerIndex,
            props.playerUpdate.frameNumber
          )
        ).inputs.processed.anyTrigger
      : props.playerUpdate.inputs.processed.anyTrigger || 1
  );
  // Formulas from https://www.ssbwiki.com/Shield#Shield_statistics
  const triggerStrengthMultiplier = createMemo(
    () => 1 - (0.5 * (triggerStrength() - 0.3)) / 0.7
  );
  const shieldSizeMultiplier = createMemo(
    () => ((shieldHealth() * triggerStrengthMultiplier()) / 60) * 0.85 + 0.15
  );
  return (
    <>
      <Show
        when={["GuardOn", "Guard", "GuardReflect", "GuardDamage"].includes(
          props.renderData.animationName
        )}
      >
        <circle
          // TODO: shield tilts
          cx={
            props.renderData.position[0] +
            props.renderData.characterData.shieldOffset[0] *
              props.playerUpdate.state.facingDirection
          }
          cy={
            props.renderData.position[1] +
            props.renderData.characterData.shieldOffset[1]
          }
          r={props.renderData.characterData.shieldSize * shieldSizeMultiplier()}
          fill={
            ["red", "blue", "yellow", "green"][props.playerUpdate.playerIndex]
          }
          opacity={0.6}
        ></circle>
      </Show>
    </>
  );
}

export function Shine(props: {
  renderData: RenderData;
  playerUpdate: PlayerUpdate;
}) {
  const characterName = createMemo(
    () =>
      characterNameByExternalId[
        state.replayData()!.settings.playerSettings[
          props.playerUpdate.playerIndex
        ].externalCharacterId
      ]
  );
  return (
    <>
      <Show
        when={
          (["Fox", "Falco"].includes(characterName()) &&
            props.renderData.animationName.includes("SpecialLw")) ||
          props.renderData.animationName.includes("SpecialAirLw")
        }
      >
        <Hexagon
          x={props.renderData.position[0]}
          // TODO get true shine position, shieldY * 3/4 is a guess.
          y={
            props.renderData.position[1] +
            (props.renderData.characterData.shieldOffset[1] * 3) / 4
          }
          r={6}
        ></Hexagon>
      </Show>
    </>
  );
}

function Hexagon(props: { x: number; y: number; r: number }) {
  const hexagonHole = 0.6;
  const sideX = Math.sin((2 * Math.PI) / 6);
  const sideY = 0.5;
  const offsets = [
    [0, 1],
    [sideX, sideY],
    [sideX, -sideY],
    [0, -1],
    [-sideX, -sideY],
    [-sideX, sideY],
  ];
  const points = createMemo(() =>
    offsets
      .map(([xOffset, yOffset]) =>
        [props.r * xOffset + props.x, props.r * yOffset + props.y].join(",")
      )
      .join(",")
  );
  const maskPoints = createMemo(() =>
    offsets
      .map(([xOffset, yOffset]) =>
        [
          props.r * xOffset * hexagonHole + props.x,
          props.r * yOffset * hexagonHole + props.y,
        ].join(",")
      )
      .join(",")
  );
  return (
    <>
      <defs>
        <mask id="innerHexagon">
          <polygon points={points()} fill="white"></polygon>
          <polygon points={maskPoints()} fill="black"></polygon>
        </mask>
      </defs>
      <polygon
        points={points()}
        fill="#8abce9"
        mask="url(#innerHexagon)"
      ></polygon>
    </>
  );
}

// For Zelda/Sheik transformations we need to update the external ID to fetch
// the other one's animations if there is a transformation. Don't bother
// preloading though because Zelda is not popular.
function adjustExternalCharacterId(
  externalCharacterId: number,
  internalCharacterId: number
) {
  const internalCharacterName = characterNameByInternalId[internalCharacterId];
  // playerSettings is not updated, it only contains the starting
  // transformation.
  switch (internalCharacterName) {
    case "Zelda":
      return characterNameByExternalId.indexOf("Zelda");
    case "Sheik":
      return characterNameByExternalId.indexOf("Sheik");
    default:
      return externalCharacterId;
  }
}

function computeRenderData(
  playerIndex: number,
  playerUpdate: PlayerUpdate,
  animations?: CharacterAnimations
): RenderData {
  const startOfActionPlayerState = getPlayerOnFrame(
    playerIndex,
    getStartOfAction(playerIndex, state.frame())
  ).state;
  const actionName = actionNameById[playerUpdate.state.actionStateId];

  const characterData =
    actionMapByInternalId[playerUpdate.state.internalCharacterId];
  const animationName =
    characterData.animationMap.get(actionName) ??
    characterData.specialsMap.get(playerUpdate.state.actionStateId) ??
    actionName;
  const animationFrames = animations?.[animationName];
  // TODO: validate L cancels & other fractional frames, currently just
  // flooring.
  // Converts - 1 to 0 and loops for Entry, Guard, etc.
  const frameIndex = modulo(
    Math.floor(max(0, playerUpdate.state.actionStateFrameCounter)),
    animationFrames?.length ?? 1
  );
  // To save animation file size, duplicate frames just reference earlier
  // matching frames such as "frame20".
  const animationPathOrFrameReference = animationFrames?.[frameIndex];
  const path = animationPathOrFrameReference?.startsWith("frame")
    ? animationFrames?.[
        Number(animationPathOrFrameReference.slice("frame".length))
      ]
    : animationPathOrFrameReference;
  const rotation =
    animationName === "DamageFlyRoll"
      ? getDamageFlyRollRotation(playerIndex, state.frame())
      : isSpacieUpB(playerIndex, state.frame())
      ? getSpacieUpBRotation(playerIndex, state.frame())
      : 0;
  // Some animations naturally turn the player around, but facingDirection
  // updates partway through the animation and incorrectly flips the
  // animation. The solution is to "fix" the facingDirection for the duration
  // of the action, as the animation expects. However upB turnarounds and
  // Jigglypuff/Kirby mid-air jumps are an exception where we need to flip
  // based on the updated state.facingDirection.
  const facingDirection = actionFollowsFacingDirection(animationName)
    ? playerUpdate.state.facingDirection
    : startOfActionPlayerState.facingDirection;
  return {
    path,
    // TODO: teams colors and shades
    innerColor: ["darkred", "darkblue", "gold", "darkgreen"][playerIndex],
    outerColor:
      startOfActionPlayerState.lCancelStatus === "missed"
        ? "red"
        : startOfActionPlayerState.hurtboxCollisionState !== "vulnerable"
        ? "blue"
        : "none",
    transforms: [
      `translate(${playerUpdate.state.xPosition} ${playerUpdate.state.yPosition})`,
      // TODO: rotate around true character center instead of current guessed
      // center of position+(0,8)
      `rotate(${rotation} 0 8)`,
      `scale(${characterData.scale} ${characterData.scale})`,
      `scale(${facingDirection} 1)`,
      `scale(.1 -.1) translate(-500 -500)`,
    ],
    animationName: animationName,
    position: [playerUpdate.state.xPosition, playerUpdate.state.yPosition],
    characterData: characterData,
  };
}

// DamageFlyRoll default rotation is (0,1), but we calculate rotation from (1,0)
// so we need to subtract 90 degrees. Quick checks:
// 0 - 90 = -90 which turns (0,1) into (1,0)
// -90 - 90 = -180 which turns (0,1) into (-1,0)
// Facing direction is handled naturally because the rotation will go the
// opposite direction (that scale happens first) and the flip of (0,1) is still
// (0, 1)
function getDamageFlyRollRotation(
  playerIndex: number,
  frameNumber: number
): number {
  const currentState = getPlayerOnFrame(playerIndex, frameNumber).state;
  const previousState = getPlayerOnFrame(playerIndex, frameNumber - 1).state;
  const deltaX = currentState.xPosition - previousState.xPosition;
  const deltaY = currentState.yPosition - previousState.yPosition;
  return (Math.atan2(deltaY, deltaX) * 180) / Math.PI - 90;
}

// Rotation will be whatever direction the player was holding at blastoff. The
// default rotation of the animation is (1,0), so we need to subtract 180 when
// facing left, and subtract 0 when facing right.
// Quick checks:
// 0 - 0 = 0, so (1,0) is unaltered when facing right
// 0 - 180 = -180, so (1,0) is flipped when facing left
function getSpacieUpBRotation(
  playerIndex: number,
  currentFrame: number
): number {
  const startOfActionPlayer = getPlayerOnFrame(
    playerIndex,
    getStartOfAction(playerIndex, currentFrame)
  );
  const joystickDegrees =
    (Math.atan2(
      startOfActionPlayer.inputs.processed.joystickY,
      startOfActionPlayer.inputs.processed.joystickX
    ) *
      180) /
    Math.PI;
  return (
    joystickDegrees -
    (startOfActionPlayer.state.facingDirection === -1 ? 180 : 0)
  );
}

// All jumps and upBs either 1) Need to follow the current frame's
// facingDirection, or 2) Won't have facingDirection change during the action.
// In either case we can grab the facingDirection from the current frame.
function actionFollowsFacingDirection(animationName: string): boolean {
  return (
    animationName.includes("Jump") ||
    ["SpecialHi", "SpecialAirHi"].includes(animationName)
  );
}

function isSpacieUpB(playerIndex: number, frameNumber: number) {
  const state = getPlayerOnFrame(playerIndex, frameNumber).state;
  const character = characterNameByInternalId[state.internalCharacterId];
  return (
    ["Fox", "Falco"].includes(character) &&
    [355, 356].includes(state.actionStateId)
  );
}

function getStartOfAction(playerIndex: number, currentFrame: number): number {
  let earliestStateOfAction = getPlayerOnFrame(playerIndex, currentFrame).state;
  while (true) {
    const testEarlierState = getPlayerOnFrame(
      playerIndex,
      earliestStateOfAction.frameNumber - 1
    )?.state;
    if (
      testEarlierState === undefined ||
      testEarlierState.actionStateId !== earliestStateOfAction.actionStateId
    ) {
      return earliestStateOfAction.frameNumber;
    }
    earliestStateOfAction = testEarlierState;
  }
}

function getPlayerOnFrame(playerIndex: number, frameNumber: number) {
  return state.replayData()!.frames[frameNumber]?.players[playerIndex];
}