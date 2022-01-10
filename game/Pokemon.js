class Pokemon {
  constructor(obj) {
    this.id = obj.id;
    this.level = 5;
    this.name = obj.pokemon.name;
    this.maxHp = obj.pokemon.hp;
    this.hp = this.maxHp;
    this.type1 = obj.pokemon.type1.id;
    this.type2 = obj.pokemon.type2.id;
    this.atk = obj.pokemon.atk;
    this.stk = obj.pokemon.stk;
    this.def = obj.pokemon.dfs;
    this.sef = obj.pokemon.sef;
    this.skills = [];
    this.skills.push(obj.skill1);
    this.skills.push(obj.skill2);
    this.skills.push(obj.skill3);
    this.skills.push(obj.skill4);
    this.nextSkill = null;
  }

  selectSkill(idx) {
    this.nextSkill = this.skills[idx];
  }

  getDamage(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.die();
    }
  }

  restoreHealth(heal) {
    this.hp += heal;
    this.hp = Math.min(this.maxHp, this.hp);
  }

  attack(target) {
    let damageResult = calculateDamage(
      this.type1,
      this.type2,
      target.type1,
      target.type2,
      this.level,
      this.nextSkill.dmg,
      this.atk,
      target.def
    );

    target.getDamage(damageResult.damage);
    /*console.log(
      `P[${this.id}, ${this.hp.toFixed(2)}] -> P[${
        target.id
      }, ${target.hp.toFixed(2)}] ${damageResult.damage.toFixed(2)}!`
    );*/

    this.nextSkill = null;

    if (target.hp <= 0) {
      return {
        result: "kill",
        effect: damageResult.effect,
      };
    } else {
      return {
        result: "default",
        effect: damageResult.effect,
      };
    }
  }
}

const Pokemon_TYPE = {
  NORMAL: 0,
  FIRE: 1,
  WATER: 2,
  ELECTRIC: 3,
  GRASS: 4,
  ICE: 5,
  FIGHTING: 6,
  POISON: 7,
  GROUND: 8,
  FLYING: 9,
  PSYCHIC: 10,
  BUG: 11,
  ROCK: 12,
  GHOST: 13,
  DRAGON: 14,
  DARK: 15,
  STEEL: 16,
  FAIRY: 17,
};

// https://pokemondb.net/type
// chart[attack_index][defense_index] = effectiveness {0, 0.5, 1, 2}
const Pokemon_TYPECHART = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0, 1, 1, 0.5, 1, 1],
  [1, 0.5, 0.5, 1, 2, 2, 1, 1, 1, 1, 1, 2, 0.5, 1, 0.5, 1, 2, 1, 1],
  [1, 2, 0.5, 1, 0.5, 1, 1, 1, 2, 1, 1, 1, 2, 1, 0.5, 1, 1, 1, 1],
  [1, 1, 2, 0.5, 0.5, 1, 1, 1, 0, 2, 1, 1, 1, 1, 0.5, 1, 1, 1, 1],
  [1, 0.5, 2, 1, 0.5, 1, 1, 0.5, 2, 0.5, 1, 0.5, 2, 1, 0.5, 1, 0.5, 1, 1],
  [1, 0.5, 0.5, 1, 2, 0.5, 1, 1, 2, 2, 1, 1, 1, 1, 2, 1, 0.5, 1, 1],
  [2, 1, 1, 1, 1, 2, 1, 0.5, 1, 0.5, 0.5, 0.5, 2, 0, 1, 2, 2, 0.5, 1],
  [1, 1, 1, 1, 2, 1, 1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 1, 0, 2, 1],
  [1, 2, 1, 2, 0.5, 1, 1, 2, 1, 0, 1, 0.5, 2, 1, 1, 1, 2, 1, 1],
  [1, 1, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 0.5, 1, 1],
  [1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0.5, 1, 1, 1, 1, 0, 0.5, 1, 1],
  [1, 0.5, 1, 1, 2, 1, 0.5, 0.5, 1, 0.5, 2, 1, 1, 0.5, 1, 2, 0.5, 0.5, 1],
  [1, 2, 1, 1, 1, 2, 0.5, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 0.5, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0.5, 0, 1],
  [1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 1, 0.5, 1],
  [1, 0.5, 0.5, 0.5, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0.5, 2, 1],
  [1, 0.5, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 1, 1, 1, 2, 2, 0.5, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// https://pokemon.fandom.com/ko/wiki/%EB%8D%B0%EB%AF%B8%EC%A7%80#3.EC.84.B8.EB.8C.80
const calculateDamage = function (
  atkType1,
  atkType2,
  defType1,
  defType2,
  level,
  power,
  atk,
  def
) {
  let mod1 = 1.0;
  let mod2 = 1.0;
  // let mod3 = 1.0;
  let critical = 1.0;

  let typeEffectness1 = 1.0;
  atkType1--;
  atkType2--;
  defType1--;
  defType2--;
  typeEffectness1 *= Pokemon_TYPECHART[atkType1][defType1];
  if (defType2) {
    typeEffectness1 *= Pokemon_TYPECHART[atkType1][defType2];
  }
  let typeEffectness2 = 1.0;
  if (atkType2) {
    typeEffectness2 *= Pokemon_TYPECHART[atkType2][defType1];
    if (defType2) {
      typeEffectness2 *= Pokemon_TYPECHART[atkType2][defType2];
    }
  }

  let effectText = "";
  const effectiveness = typeEffectness1 * typeEffectness2;
  if (effectiveness >= 2) {
    effectText = "효과가 굉장했다!";
  } else if (1 <= effectiveness && effectiveness < 2) {
    effectText = "보통 효과";
  } else if (0.5 <= effectiveness && effectiveness < 1) {
    effectText = "효과가 별로인 것 같다...";
  } else {
    effectText = "효과가 없는 것 같다...";
  }

  // console.log(typeEffectness1, typeEffectness2);

  let random = getRandomIntInclusive(85, 100);

  // gen 3  ERROR: Invalid equations... too low damage
  const damage =
    ((((((level * 2) / 5 + 2) * power * atk) / def / 50) * mod1 + 2) *
      mod2 *
      critical *
      typeEffectness1 *
      typeEffectness2 *
      random) /
    100;

  return { damage: damage, effect: effectText };
};

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export { Pokemon, Pokemon_TYPE, Pokemon_TYPECHART, calculateDamage };
