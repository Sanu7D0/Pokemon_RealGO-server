import { Player } from "./Player.js";
import { Pokemon_TYPECHART } from "./Pokemon.js";

const SELECT_TIMEOUT = 5000; // millisec

export class BattleScene {
  constructor() {
    this.turn = 0;
    this.isPlaying = true;
    this.players = {};
  }

  registerPlayer(id, player) {
    this.players[id] = {}; // test object

    // this.players[id] = new Player(player);
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

  receiveSkillSelection(id, skill) {
    if (this.isPlaying && !this.players[id].ready) {
      console.log(`[${this.turn}] Received skill from ${id}`);
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
    console.log(`[${this.turn}] Executed a fight`);
    /*
    // 선공 결정
    let firstAttacker = 0; // 1 -> pkm1, 2 -> pkm2
    if (pokemon1.speed === pokemon2.speed) {
      // 같으면 랜덤
      firstAttacker = [1, 2]
        .sort(() => Math.random() - Math.random())
        .slice(0, 2);
    } else if (pokemon1.speed > pokemon2.speed) {
      firstAttacker = 1;
    } else {
      firstAttacker = 2;
    }*/

    Object.entries(this.players).forEach(([key, value]) => {
      this.players[key].ready = false;
    });
    this.turn += 1;
    this.skillSelectThread();
  }
}
