import { gameOver, emitBattleResult } from "../server.js";
import { Player } from "./Player.js";

const SELECT_TIMEOUT = 30000; // millisec

export class BattleScene {
  constructor(roomId) {
    this.roomId = roomId;
    this.turn = 0;
    this.isPlaying = true;
    this.players = {};
  }

  registerPlayer(id, player) {
    this.players[id] = new Player(player);
    this.players[id].ready = false;
  }

  startBattle() {
    // 싸우고 있는 포켓몬 정보들 전달
    let startObj = [];
    Object.entries(this.players).forEach(([key, value]) => {
      let p = this.players[key];
      startObj.push({
        ownerId: p.id,
        id: p.fighter.id,
        hp: p.fighter.hp,
        name: p.fighter.name,
      });
    });
    console.log("Battle started");
    this.skillSelectThread();

    return startObj;
  }

  endBattle() {
    gameOver(this.roomId);
  }

  async skillSelectThread() {
    let threadTurn = this.turn;
    console.log(`[${this.turn}] Timeout set`);
    setTimeout(() => {
      // 턴이 진행하지 못했음 = 타임아웃
      if (threadTurn === this.turn) {
        this.isPlaying = false;
        console.log(`[${this.turn}] Timeout!`);

        // Game over
        this.endBattle();
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
    let fightResult;

    // Juicy spagetties...!
    let i = 0;
    let pok1, pok2;
    let owner1, owner2;
    for (const prop in this.players) {
      if (i === 0) {
        owner1 = this.players[prop].id;
        pok1 = this.players[prop].fighter;
      } else {
        owner2 = this.players[prop].id;
        pok2 = this.players[prop].fighter;
      }
      i++;
    }

    const pok1FirstAttack = () => {
      if (pok1.attack(pok2).result === "default") {
        fightResult = pok2.attack(pok1).result;
      } else {
        // killed
        fightResult = "kill";
      }
    };
    const pok2FirstAttack = () => {
      if (pok2.attack(pok1).result === "default") {
        fightResult = pok1.attack(pok2).result;
      } else {
        // killed
        fightResult = "kill";
      }
    };

    // Nice spagettie
    // 선공 정하기
    if (pok1.speed > pok2.speed) {
      pok1FirstAttack();
    } else if (pok1.speed < pok2.speed) {
      pok2FirstAttack();
    } else {
      // 랜덤 순서
      if (Math.random() > 0.5) {
        pok1FirstAttack();
      } else {
        pok2FirstAttack();
      }
    }

    // Response to clients
    let resultObj = {
      pokemons: [
        {
          ownerId: owner1,
          id: pok1.id,
          hp: pok1.hp,
          name: pok1.name,
        },
        {
          ownerId: owner2,
          id: pok2.id,
          hp: pok2.hp,
          name: pok2.name,
        },
      ],
      timer: SELECT_TIMEOUT,
    };
    emitBattleResult(this.roomId, resultObj);

    console.log(`[${this.turn}] Executed a fight`);
    // reset to prepare
    Object.entries(this.players).forEach(([key, value]) => {
      this.players[key].ready = false;
    });
    this.turn += 1;
    this.skillSelectThread();

    return fightResult;
  }
}
