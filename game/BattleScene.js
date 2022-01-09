import { Player } from "./Player.js";

const SELECT_TIMEOUT = 10000; // millisec

export class BattleScene {
  constructor() {
    this.turn = 0;
    this.isPlaying = true;
    this.players = {};
  }

  registerPlayer(id, player) {
    this.players[id] = new Player(player);
    this.players[id].ready = false;
  }

  startBattle() {
    console.log("Battle started");
    this.skillSelectThread();
  }

  async skillSelectThread() {
    let threadTurn = this.turn;
    console.log(`[${this.turn}] Timeout set`);
    setTimeout(() => {
      // 턴이 진행하지 못했음 = 타임아웃
      if (threadTurn === this.turn) {
        this.isPlaying = false;
        console.log(`[${this.turn}] Timeout!`);
      }
    }, SELECT_TIMEOUT);
  }

  receiveSkillSelection(id, skillIndex) {
    if (this.isPlaying && !this.players[id].ready) {
      console.log(`[${this.turn}] Received skill from ${id}`);
      this.players[id].fighter.selectSkill(skillIndex);
      this.players[id].ready = true;

      if (Object.keys(this.players).length === 2) {
        // check both ready and fight
        let bothReady = true;
        Object.entries(this.players).forEach(([key, value]) => {
          if (!this.players[key].ready) {
            bothReady = false;
          }
        });

        if (bothReady) {
          this.executeFight();
        }
      }
    } else {
      console.log(`[${this.turn}] Received skill from ${id} failed!`);
    }
  }

  executeFight() {
    // Juicy spagetties...!
    let i = 0;
    let pok1, pok2;
    for (const prop in this.players) {
      if (i === 0) {
        pok1 = this.players[prop].fighter;
      } else {
        pok2 = this.players[prop].fighter;
      }
      i++;
    }

    // Nice spagettie
    // 선공 정하기
    if (pok1.speed > pok2.speed) {
      pok1.attack(pok2);
      pok2.attack(pok1);
    } else if (pok1.speed < pok2.speed) {
      pok2.attack(pok1);
      pok1.attack(pok2);
    } else {
      // 랜덤 순서
      if (Math.random() > 0.5) {
        pok1.attack(pok2);
        pok2.attack(pok1);
      } else {
        pok2.attack(pok1);
        pok1.attack(pok2);
      }
    }

    console.log(`[${this.turn}] Executed a fight`);
    // reset to prepare
    Object.entries(this.players).forEach(([key, value]) => {
      this.players[key].ready = false;
    });
    this.turn += 1;
    this.skillSelectThread();
  }
}
