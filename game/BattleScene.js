import { emitBattleEnd, emitBattleResult } from "../server.js";
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
    let startObj = {
      fights: [],
      pokemonNames: [],
    };
    Object.entries(this.players).forEach(([key, value]) => {
      let p = this.players[key];

      // 시작 포켓몬 정보
      startObj.fights.push(
        this.FightResult(
          p.id,
          p.fighter.name,
          p.fighter.id,
          "default",
          "",
          p.fighter.hp,
          undefined,
          p.fighter.maxHp
        )
      );
      // 포켓몬 이름들 넣기
      p.pokemons.forEach((pok) => {
        startObj.pokemonNames.push(pok.name);
      });
    });
    // 포켓몬 이름 중복 제거
    startObj.pokemonNames = [...new Set(startObj.pokemonNames)];

    console.log("Battle started");
    this.skillSelectThread();

    return startObj;
  }

  async skillSelectThread() {
    let threadTurn = this.turn;
    let bindingSceneId = this.roomId;
    console.log(`[${this.turn}] Timeout set`);
    setTimeout(() => {
      // 다음 게임에 영향 못미치게
      if (bindingSceneId !== this.roomId) {
        return;
      }

      // 턴이 진행하지 못했음 = 타임아웃
      if (threadTurn === this.turn) {
        this.isPlaying = false;
        console.log(`[${this.turn}] Timeout!`);

        // Game over
        let _state = {
          key: "end",
          winner: "Draw",
        };
        emitBattleEnd(this.roomId, _state);
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
          try {
            this.executeFight();
          } catch (e) {
            console.error("Excute fight failed");
          }
        }
      }
    } else {
      console.log(`[${this.turn}] Received skill from ${id} failed!`);
    }
  }

  FightResult(
    _ownerId,
    _name,
    _id,
    _result,
    _effect,
    _hp,
    _attackOrder,
    _maxHp
  ) {
    return {
      ownerId: _ownerId,
      name: _name,
      id: _id,
      result: _result,
      effect: _effect,
      hp: _hp,
      attackOrder: _attackOrder,
      maxHp: _maxHp,
    };
  }

  executeFight() {
    // Juicy spagetties...!
    let i = 0;
    let pok1, pok2;
    let owner1, owner2;
    for (const prop in this.players) {
      if (i === 0) {
        owner1 = this.players[prop];
        pok1 = owner1.fighter;
      } else {
        owner2 = this.players[prop];
        pok2 = owner2.fighter;
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
        firstPok.id,
        "default",
        attacked.effect,
        undefined,
        1,
        firstPok.maxHp
      );

      if (attacked.result === "default") {
        attacked = secondPok.attack(firstPok);
        fightResult2 = this.FightResult(
          secondOwner.id,
          secondPok.name,
          secondPok.id,
          "default",
          attacked.effect,
          secondPok.hp,
          2,
          secondPok.maxHp
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
              nextFighter.id,
              "default",
              `나와라 ${nextFighter.name}!`,
              nextFighter.hp,
              undefined,
              nextFighter.maxHp
            );
            _state.key = "switch";
            console.log(`[${this.turn}] Next pokemon of ${firstOwner.id}`);
          } else {
            // No more fighters -> game over
            _state.winner = secondOwner.id;
            _state.key = "end";
          }
        }
      } else {
        // pok1 killed pok2 and no pok2 attack
        fightResult2 = this.FightResult(
          secondOwner.id,
          secondPok.name,
          secondPok.id,
          "die",
          "None",
          secondPok.hp,
          undefined,
          secondPok.maxHp
        );
        fightResult1.hp = firstPok.hp;
        if (secondOwner.setNextFighter()) {
          let nextFighter = secondOwner.fighter;
          _state.switch = this.FightResult(
            secondOwner.id,
            nextFighter.name,
            nextFighter.id,
            "default",
            `나와라 ${nextFighter.name}!`,
            nextFighter.hp,
            undefined,
            nextFighter.maxHp
          );
          _state.key = "switch";
          console.log(`[${this.turn}] Next pokemon of ${firstOwner.id}`);
        } else {
          _state.winner = firstOwner.id;
          _state.key = "end";
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

    console.log(`[${this.turn}] Executed a fight`);

    if (_state.key === "end") {
      console.log(`[${this.turn}] Winner = ${_state.winner}`);
      emitBattleEnd(this.roomId, {
        state: _state,
        result: resultObj,
      });
    } else {
      emitBattleResult(this.roomId, resultObj);

      // reset to prepare
      Object.entries(this.players).forEach(([key, value]) => {
        this.players[key].ready = false;
      });
      this.turn += 1;
      this.skillSelectThread();
    }
  }
}
