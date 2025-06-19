import Phaser from "phaser";
import MainScene from "./game/mainScene";
import './main.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 640,
  backgroundColor: '#000',
  scene: [MainScene],
  pixelArt: true,
};

new Phaser.Game(config);
