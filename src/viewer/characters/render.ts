import type {
  FrameEntryType,
  FramesType,
  PlayerType,
  PostFrameUpdateType,
} from '@slippi/slippi-js';

import {
  CharacterAnimations,
  AnimationFrame,
  fetchAnimation,
  isOneIndexed,
  actions,
  specials,
} from '../animations';
import { supportedCharactersById } from '../characters';
import { characterNamesById, DeepRequired } from '../common';
import type { Render } from '../game';
import type { Layer, Layers } from '../layer';
import {
  isInFrame,
  getFacingDirection,
  getFirstFrameOfAnimation,
  getFrameIndexFromDuration,
  getThrowerName,
  getShade,
} from '../replay';

export const createPlayerRender = async (
  player: DeepRequired<PlayerType>,
  players: DeepRequired<PlayerType[]>,
  isDoubles: boolean,
): Promise<Render> => {
  const animations = await fetchAnimation(player.characterId);
  return (
    layers: Layers,
    frame: DeepRequired<FrameEntryType>,
    frames: DeepRequired<FramesType>,
    isDarkMode: boolean,
  ) => {
    if (!isInFrame(frame, player)) {
      return;
    }
    renderUi(layers.screenSpace, frame, player, players, isDoubles, isDarkMode);
    renderCharacter(
      layers.worldSpace.context,
      frame,
      frames,
      player,
      players,
      isDoubles,
      isDarkMode,
      animations,
    );
    renderShield(
      layers.worldSpace.context,
      frame,
      player,
      players,
      isDoubles,
      isDarkMode,
    );
    renderShine(layers.worldSpace.context, frame, player);
  };
};

const colors = ['pink', 'lightblue', 'yellow', 'lightgreen'];
const darkColors = ['red', 'blue', 'gold', 'green'];
const teamColors = [
  ['#FFA0A0', '#FFC0CB', 'red'],
  ['lightblue', 'lightcyan', 'blue'],
  ['limegreen', 'lightgreen', 'green'],
];
const darkTeamColors = [
  ['red', '#FF5050', 'darkred'],
  ['dodgerblue', 'deepskyblue', 'darkblue'],
  ['#00BB00', 'springgreen', 'darkgreen'],
];

const getPrimaryColor = (
  player: DeepRequired<PlayerType>,
  players: DeepRequired<PlayerType[]>,
  isDarkMode: boolean,
  isDoubles: boolean,
): string => {
  if (isDoubles) {
    return (isDarkMode ? darkTeamColors : teamColors)[player.teamId][
      getShade(player.playerIndex, players)
    ];
  } else {
    return (isDarkMode ? darkColors : colors)[player.playerIndex];
  }
};

const getSecondaryColor = (
  playerFrame: DeepRequired<PostFrameUpdateType>,
  lCancelStatus: number,
): string => {
  return playerFrame.hurtboxCollisionState > 0
    ? 'blue' // invinc / invuln
    : lCancelStatus === 2
    ? 'red' // missed lcanc
    : 'black';
};

const renderStocks = (
  screenLayer: Layer,
  frame: DeepRequired<FrameEntryType>,
  player: DeepRequired<PlayerType>,
  players: DeepRequired<PlayerType[]>,
  isDoubles: boolean,
  isDarkMode: boolean,
): void => {
  // TODO: Handle stock count >4 or non-stock modes
  const playerFrame = frame.players[player.playerIndex].post;
  const stockCount = playerFrame.stocksRemaining;
  screenLayer.context.save();
  screenLayer.context.fillStyle = getPrimaryColor(
    player,
    players,
    isDarkMode,
    isDoubles,
  );
  screenLayer.context.strokeStyle = isDarkMode ? 'white' : 'black';
  for (let stockIndex = 0; stockIndex < stockCount; stockIndex++) {
    const x = ((stockIndex - 2) * screenLayer.canvas.width) / 40;
    const y = 0;
    const radius = screenLayer.canvas.width / 100;
    screenLayer.context.beginPath();
    screenLayer.context.arc(x, y, radius, 0, 2 * Math.PI);
    screenLayer.context.closePath();
    screenLayer.context.fill();
    screenLayer.context.stroke();
  }
  screenLayer.context.restore();
};

const renderPercent = (
  screenLayer: Layer,
  frame: DeepRequired<FrameEntryType>,
  player: DeepRequired<PlayerType>,
  players: DeepRequired<PlayerType[]>,
  isDoubles: boolean,
  isDarkMode: boolean,
): void => {
  const playerFrame = frame.players[player.playerIndex].post;
  const percent = `${Math.floor(playerFrame.percent)}%`;
  screenLayer.context.save();
  const fontSize = screenLayer.canvas.height / 15;
  screenLayer.context.font = `900 ${fontSize}px Arial`;
  screenLayer.context.textAlign = 'center';
  screenLayer.context.strokeStyle = isDarkMode ? 'white' : 'black';
  screenLayer.context.fillStyle = getPrimaryColor(
    player,
    players,
    isDarkMode,
    isDoubles,
  );
  const x = 0;
  const y = -screenLayer.canvas.height / 10;
  screenLayer.context.translate(x, y);
  // flip text back right-side after global flip
  screenLayer.context.scale(1, -1);
  screenLayer.context.fillText(percent, 0, 0);
  screenLayer.context.strokeText(percent, 0, 0);
  screenLayer.context.restore();
};

const renderPlayerDetails = (
  screenLayer: Layer,
  frame: DeepRequired<FrameEntryType>,
  player: DeepRequired<PlayerType>,
  players: DeepRequired<PlayerType[]>,
  isDoubles: boolean,
  isDarkMode: boolean,
): void => {
  //const playerFrame = frame.players[player.playerIndex].post;
  screenLayer.context.save();
  const fontSize = screenLayer.canvas.height / 30;
  screenLayer.context.font = `900 ${fontSize}px Verdana`;
  screenLayer.context.textAlign = 'center';
  screenLayer.context.strokeStyle = isDarkMode ? 'white' : 'black';
  screenLayer.context.fillStyle = getPrimaryColor(
    player,
    players,
    isDarkMode,
    isDoubles,
  );
  const x = 0;
  const y = -screenLayer.canvas.height / 7.5;
  screenLayer.context.translate(x, y);
  // flip text back right-side after global flip
  screenLayer.context.scale(1, -1);
  const name = player.displayName?.length ? player.displayName : player.nametag;
  // const name = `${playerFrame.actionStateId},${playerFrame.actionStateCounter}`;
  screenLayer.context.fillText(name, 0, 0);
  screenLayer.context.strokeText(name, 0, 0);
  screenLayer.context.restore();
};

const getAnimation = (
  player: DeepRequired<PlayerType>,
  playerFrame: DeepRequired<PostFrameUpdateType>,
  frames: DeepRequired<FramesType>,
  frame: DeepRequired<FrameEntryType>,
  animations: CharacterAnimations,
  worldContext: CanvasRenderingContext2D,
): AnimationFrame | undefined => {
  const character = characterNamesById[player.characterId];
  const animationName =
    actions[playerFrame.actionStateId] ??
    specials[character][playerFrame.actionStateId];
  console.assert(
    animationName !== undefined,
    'characterId',
    player.characterId,
    'actionStateId',
    playerFrame.actionStateId,
  );
  if (animationName.match('DEAD')) {
    return;
  }
  const animation =
    animations[animationName] ??
    animations[
      animationName.substr(0, 6) +
        getThrowerName(player, animationName, frame) +
        animationName.substr(6)
    ];
  console.assert(
    animation !== undefined,
    'actionStateCounter',
    playerFrame.actionStateCounter,
    'animationData',
    animation,
    'animationName',
    animationName,
  );
  const firstIndex =
    playerFrame.actionStateCounter < 0 ||
    isOneIndexed(player.characterId, playerFrame.actionStateId)
      ? 1
      : 0;
  const frameIndex =
    animationName.startsWith('LANDINGATTACKAIR') ||
    animationName.startsWith('THROWN')
      ? Math.min(
          getFrameIndexFromDuration(playerFrame, frames, player),
          animation.length - 1,
        )
      : // ENTRANCE has some negative actionStateCounters for some reason...
        // TODO: switch ENTRANCE to IndexFromDuration
        Math.max(0, Math.floor(playerFrame.actionStateCounter) - firstIndex) %
        animation.length;
  const animationFrame = animation[frameIndex];
  const isSpacieUpBLaunchAction =
    playerFrame.actionStateId === 355 || playerFrame.actionStateId === 356;
  const isSpacieUpBMovementFrame =
    (character === 'Fox' && frameIndex < 31) ||
    (character === 'Falco' && frameIndex < 23);
  if (isSpacieUpBLaunchAction && isSpacieUpBMovementFrame) {
    // just a guess, especially with 2 different characters...
    const rotationYOffset = -125;
    const rawAngle = Math.atan2(
      playerFrame.selfInducedSpeeds.y + playerFrame.selfInducedSpeeds.attackY,
      playerFrame.selfInducedSpeeds.airX +
        playerFrame.selfInducedSpeeds.attackX +
        playerFrame.selfInducedSpeeds.groundX,
    );
    const angleFromUp = rawAngle - Math.PI / 2;
    worldContext.translate(0, rotationYOffset);
    worldContext.rotate(-angleFromUp);
    worldContext.translate(0, -rotationYOffset);
  }

  const facingDirection = getFacingDirection(
    playerFrame.facingDirection,
    animationName,
    character,
    frameIndex,
  );
  worldContext.scale(facingDirection, 1);
  return animationFrame;
};

const renderCharacter = (
  worldContext: CanvasRenderingContext2D,
  frame: DeepRequired<FrameEntryType>,
  frames: DeepRequired<FramesType>,
  player: DeepRequired<PlayerType>,
  players: DeepRequired<PlayerType[]>,
  isDoubles: boolean,
  isDarkMode: boolean,
  animations: CharacterAnimations,
): void => {
  const playerFrame = frame.players[player.playerIndex].post;
  const characterData = supportedCharactersById[player.characterId];
  worldContext.save();
  worldContext.lineWidth *= isDarkMode ? 3 : 2;

  const lCancelStatus = getFirstFrameOfAnimation(
    playerFrame,
    frames,
  ).lCancelStatus;
  const primaryColor = getPrimaryColor(player, players, isDarkMode, isDoubles);
  const secondaryColor = getSecondaryColor(playerFrame, lCancelStatus);
  worldContext.strokeStyle = isDarkMode ? primaryColor : secondaryColor;
  worldContext.fillStyle = isDarkMode ? secondaryColor : primaryColor;
  worldContext.translate(playerFrame.positionX, playerFrame.positionY);
  // world space -> animation data space, -y is because the data seems to be
  // flipped relative to the stage data..
  worldContext.scale(characterData.scale, -characterData.scale);
  worldContext.lineWidth /= characterData.scale;

  worldContext.save();
  worldContext.scale(1 / characterData.scale, 1 / characterData.scale);
  worldContext.lineWidth *= characterData.scale;

  worldContext.scale(0.96, 0.96);
  worldContext.lineWidth /= 0.96;
  worldContext.scale(0.1, 0.1);
  worldContext.lineWidth /= 0.1;
  worldContext.translate(-500, -500);
  const foxDashFrame0Path = new Path2D(
    'M 478.5 337 L 488 343.5 L 490.5 347 Q 499.8 348.8 504 355.5 L 508 361.5 L 511 370.5 L 511 380 Q 505.2 380.4 502 384.5 L 506.5 392 L 511 394.5 L 514 399.5 L 513 401.5 L 514 406.5 L 512 413.5 L 515 416.5 L 514 417.5 L 513 426.5 L 511 430 L 528.5 427 L 539.5 422 L 554.5 420 L 555.5 421 L 567.5 422 L 584 430 L 584 431.5 L 575.5 440 L 561.5 446 L 545.5 450 L 527.5 450 L 517.5 448 L 514.5 446 L 513 452.5 L 516 457.5 L 514 463.5 L 518 470.5 Q 517 479.8 520 484 L 526 485 L 525 491.5 L 526 492.5 L 526 499 L 499.5 501 Q 496.5 499.5 498 493.5 L 510 485.5 L 496.5 470 L 491 465.5 Q 490.8 458.8 487.5 455 Q 482.9 453.6 485 459.5 L 483 459.5 L 481 464.5 L 483 468.5 L 480 476.5 L 480 485.5 Q 484.5 490.3 483 500 L 459.5 499 L 458.5 500 L 444.5 500 L 441 499 L 440 493.5 Q 446.2 486.7 459.5 487 L 462.5 488 L 468 484.5 L 462 467.5 L 462 461.5 Q 458.5 459.5 459 453.5 L 462 447.5 L 459.5 447 L 456.5 448 L 455 445 Q 451.2 445.8 450 442.5 Q 447.4 439.6 448 433.5 Q 450.7 426.7 460.5 427 L 465 428 L 467.5 424 L 468.5 425 L 472 421.5 L 470 413.5 L 470 403.5 Q 472.3 402.3 469.5 401 Q 466.9 401.8 468 398.5 L 467 394.5 L 471 391.5 L 460.5 391 L 450.5 387 L 448 384.5 Q 445.9 378.6 450.5 380 L 460 373.5 Q 463 370.5 463 364.5 L 468 358.5 L 468 353.5 L 467 351.5 L 474 347.5 Q 474.6 340.6 478.5 337 Z',
  );
  //  worldContext.stroke(foxDashFrame0Path);
  worldContext.restore();

  const animationFrame = getAnimation(
    player,
    playerFrame,
    frames,
    frame,
    animations,
    worldContext,
  );
  if (animationFrame === undefined) {
    worldContext.restore();
    return;
  }
  worldContext.beginPath();
  worldContext.moveTo(animationFrame[0], animationFrame[1]);
  // starting from index 2, each set of 6 numbers are bezier curve coords
  for (
    let startOfBezierCurve = 2;
    startOfBezierCurve < animationFrame.length;
    startOfBezierCurve += 6
  ) {
    const nextBezierCurve = animationFrame.slice(
      startOfBezierCurve,
      startOfBezierCurve + 6,
    ) as unknown as Parameters<typeof worldContext.bezierCurveTo>;
    worldContext.bezierCurveTo(...nextBezierCurve);
  }
  worldContext.closePath();
  worldContext.fill();
  worldContext.stroke();
  worldContext.restore();
};

const renderShield = (
  worldContext: CanvasRenderingContext2D,
  frame: DeepRequired<FrameEntryType>,
  player: DeepRequired<PlayerType>,
  players: DeepRequired<PlayerType[]>,
  isDoubles: boolean,
  isDarkMode: boolean,
): void => {
  const playerFrame = frame.players[player.playerIndex].post;
  const characterData = supportedCharactersById[player.characterId];
  if (playerFrame.actionStateId < 0x0b2 || playerFrame.actionStateId > 0x0b6) {
    return;
  }
  worldContext.save();
  worldContext.globalAlpha = 0.75;
  worldContext.fillStyle = getPrimaryColor(
    player,
    players,
    isDarkMode,
    isDoubles,
  );
  worldContext.strokeStyle = isDarkMode ? 'white' : 'black';
  const shieldHealthPercent = playerFrame.shieldSize / 60;
  worldContext.translate(playerFrame.positionX, playerFrame.positionY);
  worldContext.translate(
    characterData.shieldOffset.x,
    characterData.shieldOffset.y,
  );
  // TODO: Seems to be some constant added because shield break happens before
  // radius 0.
  // Guessing shield size attribute is diameter so divide by 2
  const shieldRadius = (characterData.shieldSize * shieldHealthPercent) / 2;
  worldContext.beginPath();
  worldContext.arc(0, 0, shieldRadius, 0, 2 * Math.PI);
  worldContext.closePath();
  worldContext.fill();
  worldContext.stroke();
  worldContext.restore();
};

const renderShine = (
  worldContext: CanvasRenderingContext2D,
  frame: DeepRequired<FrameEntryType>,
  player: DeepRequired<PlayerType>,
): void => {
  const playerFrame = frame.players[player.playerIndex].post;
  const character = characterNamesById[player.characterId];
  const characterData = supportedCharactersById[player.characterId];
  if (
    (character !== 'Fox' && character !== 'Falco') ||
    playerFrame.actionStateId < 360 ||
    playerFrame.actionStateId > 369
  ) {
    return;
  }
  worldContext.save();
  worldContext.strokeStyle = 'aqua';
  worldContext.lineWidth *= 5;

  worldContext.translate(playerFrame.positionX, playerFrame.positionY);
  worldContext.translate(
    characterData.shieldOffset.x,
    characterData.shieldOffset.y,
  );
  // world space --> shine space
  // shine is 0.9 * shield size
  // TODO: spacies have different sized shines
  // not as big as shield because we have linewidth
  const shineScale = (characterData.shieldSize / 2) * 0.9;
  worldContext.scale(shineScale, shineScale);
  worldContext.lineWidth /= shineScale;
  drawHexagon(1, worldContext);
  drawHexagon(0.5, worldContext);
  worldContext.restore();
};

const drawHexagon = (
  radius: number,
  worldContext: CanvasRenderingContext2D,
) => {
  worldContext.beginPath();
  const sixths = (2 * Math.PI) / 6;
  worldContext.moveTo(0, radius);
  for (var hexPart = 0; hexPart < 6; hexPart++) {
    worldContext.lineTo(
      radius * Math.sin(sixths * (hexPart + 1)),
      radius * Math.cos(sixths * (hexPart + 1)),
    );
  }
  worldContext.closePath();
  worldContext.stroke();
};

const renderUi = (
  screenLayer: Layer,
  frame: DeepRequired<FrameEntryType>,
  player: DeepRequired<PlayerType>,
  players: DeepRequired<PlayerType[]>,
  isDoubles: boolean,
  isDarkMode: boolean,
): void => {
  screenLayer.context.save();
  const playerUiX = screenLayer.canvas.width * 0.2 * (player.playerIndex + 1);
  const playerUiY = screenLayer.canvas.height / 5;
  screenLayer.context.translate(playerUiX, playerUiY);
  renderStocks(screenLayer, frame, player, players, isDoubles, isDarkMode);
  renderPercent(screenLayer, frame, player, players, isDoubles, isDarkMode);
  renderPlayerDetails(
    screenLayer,
    frame,
    player,
    players,
    isDoubles,
    isDarkMode,
  );
  screenLayer.context.restore();
};
