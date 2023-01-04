<template>
  <div class="connections">
    <canvas id="pixi"></canvas>
  </div>
</template>

<script lang="ts">
import { Application } from "@pixi/app";
import { Assets } from "@pixi/assets";
import { Spritesheet } from "@pixi/spritesheet";
import { AnimatedSprite } from "@pixi/sprite-animated";

export default {
  name: "ConnectionsLayer",

  methods: {
    async drawPixi() {
      var canvas = document.getElementById("pixi") as HTMLCanvasElement;

      const app = new Application({
        width: window.innerWidth,
        height: window.innerHeight,
        antialias: true,
        view: canvas,
      });

      const sheetJson = await fetch("./src/assets/spritesheet.json");
      const sheetImage = await Assets.load("./src/assets/spritesheet.png");

      console.debug("Sheet image");
      console.debug(sheetImage);

      console.debug("Sheet json");
      console.debug(sheetJson);

      const spritesheet = new Spritesheet(sheetImage, await sheetJson.json());

      const fun = await spritesheet.parse();

      console.debug("fun");
      console.debug(fun);

      console.debug("spritesheet");
      console.debug(spritesheet);

      let y = 0;
      for (const monster of [
        "goo",
        "bee",
        "rgoo",
        "crab",
        "franky",
        "a1",
        "a2",
        "a3",
        "a4",
        "a5",
        "a6",
      ]) {
        let x = 50;
        let sprite: AnimatedSprite;
        for (const position of ["N", "E", "S", "W"]) {
          sprite = new AnimatedSprite(
            spritesheet.animations[`${monster}_${position}`]
          );
          if (position == "N") {
            y += sprite.height + 25;
            console.log(monster, "height is", sprite.height);
          }
          sprite.scale.set(1.5);
          sprite.position.set(x, y);
          sprite.updateAnchor = true;
          sprite.animationSpeed = 0.1;
          sprite.play();
          app.stage.addChild(sprite);
          x += 50;
        }
      }
    },
  },

  mounted() {
    this.drawPixi();
  },
};
</script>
