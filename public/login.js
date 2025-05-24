class Game extends Phaser.Scene {
  constructor() {
    super({
      key: "Game",
      physics: {
        default: "arcade",
        arcade: {
          debug: false,
        },
      },
    });
  }

  preload() {
    this.load.setBaseURL("assets");
    this.load.plugin(
      "rexroundrectangleplugin",
      "plugins/rexroundrectangleplugin.min.js",
      true
    );
    this.load.image("UIBackground", "backgrounds/UIBackground.png");
    this.load.image("background", "backgrounds/background.png");
    this.load.image("logo", "UI/background-logo.png");
    this.load.image("play", "UI/play-button.png");
    this.load.image("star", "collectibles/star.png");
    this.load.image("home", "UI/home-icon.png");
    this.load.image("info", "UI/info.png");
    this.load.image("close", "UI/close.png");
    this.load.image("infoIcon", "UI/info-icon.png");
    this.load.image("b1", "player/player1.png");
    this.load.image("b2", "player/player2.png");
    this.load.image("x", "backgrounds/x_logo.png");

    this.load.audio("woosh", "sounds/Woosh.mp3");
  }

  create() {
    this.checkSocket();
    this.canJump = true;
  }

  checkSocket() {
    this.addUI();
  }

  addUI() {
    this.addHomeUI();
  }

  addHomeUI() {
    this.UIBackground = this.add.image(400, 600, "UIBackground").setScale(1);

    this.infoIcon = this.add
      .image(740, 55, "infoIcon")
      .setScale(0.4)
      .setInteractive();

    this.infoIcon.on("pointerdown", () => {
      this.tweens.add({
        targets: this.infoIcon,
        scale: 0.5,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: this.infoIcon,
            scale: 0.4,
            duration: 100,

            onComplete: () => {
              this.screen = "info";

              this.scene.restart();
            },
          });
        },
      });
    });

    this.logo = this.add.image(400, 280, "logo").setScale(1);

    this.termsText = this.add
      .text(
        400,
        1170,
        "Powered by Md Mahabub. By playing this game you accept these Terms & policies.",
        {
          fontFamily: "RakeslyRG",
          fontSize: "20px",
          color: "#ffffff",
          align: "center",
        }
      )
      .setOrigin(0.5)
      .setInteractive({ cursor: "pointer" });

    this.termsText.on("pointerup", () => {
      const url = "https://www.proviva.se";
      window.open(url, "_blank");
    });

    this.loginBtn = this.add
      .rexRoundRectangle(400, 960, 520, 80, 40, 0xffdd00)
      .setDepth(5)
      .setScrollFactor(0)
      .setInteractive();
    this.loginBtnText = this.add
      .text(380, 960, "Log in with ", {
        fontFamily: "RakeslyRG",
        fontSize: "32px",
        color: "#000",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.xLogo = this.add.image(470, 960, "x").setScale(0.4).setDepth(6);

    this.loginBtn.on("pointerdown", () => {
      this.tweens.add({
        targets: [this.loginBtn, this.loginBtnText],
        scale: 0.85,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: [this.loginBtn, this.loginBtnText],
            scale: 1,
            duration: 100,

            onComplete: () => {
              window.location.href = XURL;
            },
          });
        },
      });
    });
  }
}

const game = new Phaser.Game({
  parent: "game",
  type: Phaser.AUTO,
  width: 800,
  height: 1200,
  border: 2,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true,
  },
  input: {
    activePointers: 3,
  },
  scene: [Game],
});

window.oncontextmenu = (event) => {
  event.preventDefault();
};

console.warn = () => {
  return false;
};
