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

  FightResult(_ownerId, _name, _result, _effect, _hp) {
    return {
      ownerId: _ownerId,
      name: _name,
      result: _result,
      effect: _effect,
      hp: _hp,
    };
  }

  executeFight() {
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

    let _state = {
      key: "default",
      winner: "None",
      switch: undefined,
    };
    let fightResult1, fightResult2;

    const excuteAttack = (firstOwner, firstPok, secondOwner, secondPok) => {
      // Create fight result of pokemon 1
      let attacked = firstPok.attack(secondPok);
      fightResult1 = this.FightResult(
        firstOwner.id,
        firstPok.name,
        "default",
        attacked.effect,
        undefined
      );

      if (attacked.result === "default") {
        attacked = secondPok.attack(firstPok).result;
        fightResult2 = this.FightResult(
          secondOwner.id,
          secondPok.name,
          "default",
          attacked.effect,
          secondPok.hp
        );
        fightResult1.hp = firstPok.hp;

        // pok2 killed pok1
        if (attacked.result === "kill") {
          fightResult1.result = "die";
          if (firstOwner.setNextFighter()) {
            let nextFighter = firstOwner.fighter;
            _state.switch = this.FightResult(
              firstOwner.id,
              nextFighter.name,
              "default",
              `나와라 ${nextFighter.name}!`,
              nextFighter.hp
            );
          } else {
            _state.winner = secondOwner.id;
          }
        }
      } else {
        // pok1 killed pok2 and no pok2 attack
        fightResult2 = this.FightResult(
          secondOwner.id,
          secondPok.name,
          "die",
          "None",
          secondPok.hp
        );
        if (secondOwner.setNextFighter()) {
          let nextFighter = secondOwner.fighter;
          _state.switch = this.FightResult(
            secondOwner.id,
            nextFighter.name,
            "default",
            `나와라 ${nextFighter.name}!`,
            nextFighter.hp
          );
        } else {
          _state.winner = firstOwner.id;
        }
      }
    };

    // 선공 정하기
    if (pok1.speed > pok2.speed) {
      excuteAttack(owner1, pok1, owner2, pok2);
    } else if (pok1.speed < pok2.speed) {
      excuteAttack(owner2, pok2, owner1, pok1);
    } else {
      // 랜덤 순서
      if (Math.random() > 0.5) {
        excuteAttack(owner1, pok1, owner2, pok2);
      } else {
        excuteAttack(owner2, pok2, owner1, pok1);
      }
    }

    // TODO: results: [result1, result2], state: "gameover, switch to ~"

    // Response to clients
    let resultObj = {
      fights: [fightResult1, fightResult2],
      state: _state,
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
  }
}
