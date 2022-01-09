class Pokemon {
  constructor(obj) {
    this.id = obj.id;
    this.level = obj.level;
    this.maxHp = obj.maxHp;
    this.hp = this.maxHp;
    this.level = obj.level;
    this.type1 = obj.type1;
    this.type2 = obj.type2;
    this.atk = obj.atk;
    this.stk = obj.stk;
    this.def = obj.def;
    this.sef = obj.sef;
    this.skills = [];
    for (var idx in obj.skills) {
      this.skills.push(obj.skills[idx]);
    }
    this.nextSkill = null;
  }

  selectSkill(idx) {
    this.nextSkill = this.skills[idx];
  }

  getDamage(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.die();
      return "- Target died!";
    }
    return `- Attacked with ${dmg} damage!`;
  }

  restoreHealth(heal) {
    this.hp += heal;
    this.hp = Math.min(this.maxHp, this.hp);
  }

  attack(target) {
    let damage = calculateDamage(
      this.type1,
      this.type2,
      target.type1,
      target.type2,
      this.level,
      this.nextSkill.power,
      this.atk,
      target.def
    );

    const attackResult = target.getDamage(damage);
    console.log(
      `P[${this.id}, ${this.hp.toFixed(2)}] -> P[${
        target.id
      }, ${target.hp.toFixed(2)}] ${damage.toFixed(2)}!`
    );

    this.nextSkill = null;
  }

  die() {}
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
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0, 1, 1, 0.5, 1],
  [1, 0.5, 0.5, 1, 2, 2, 1, 1, 1, 1, 1, 2, 0.5, 1, 0.5, 1, 2, 1],
  [1, 2, 0.5, 1, 0.5, 1, 1, 1, 2, 1, 1, 1, 2, 1, 0.5, 1, 1, 1],
  [1, 1, 2, 0.5, 0.5, 1, 1, 1, 0, 2, 1, 1, 1, 1, 0.5, 1, 1, 1],
  [1, 0.5, 2, 1, 0.5, 1, 1, 0.5, 2, 0.5, 1, 0.5, 2, 1, 0.5, 1, 0.5, 1],
  [1, 0.5, 0.5, 1, 2, 0.5, 1, 1, 2, 2, 1, 1, 1, 1, 2, 1, 0.5, 1],
  [2, 1, 1, 1, 1, 2, 1, 0.5, 1, 0.5, 0.5, 0.5, 2, 0, 1, 2, 2, 0.5],
  [1, 1, 1, 1, 2, 1, 1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 1, 0, 2],
  [1, 2, 1, 2, 0.5, 1, 1, 2, 1, 0, 1, 0.5, 2, 1, 1, 1, 2, 1],
  [1, 1, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 0.5, 1],
  [1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0.5, 1, 1, 1, 1, 0, 0.5, 1],
  [1, 0.5, 1, 1, 2, 1, 0.5, 0.5, 1, 0.5, 2, 1, 1, 0.5, 1, 2, 0.5, 0.5],
  [1, 2, 1, 1, 1, 2, 0.5, 1, 0.5, 2, 1, 2, 1, 1, 1, 1, 0.5, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0.5, 0],
  [1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 2, 1, 1, 2, 1, 0.5, 1, 0.5],
  [1, 0.5, 0.5, 0.5, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0.5, 2],
  [1, 0.5, 1, 1, 1, 1, 2, 0.5, 1, 1, 1, 1, 1, 1, 2, 2, 0.5, 1],
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
  let mod3 = 1.0;
  let critical = 1.0;

  let typeEffectness1 = 1.0;
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

  return damage;
};

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export { Pokemon, Pokemon_TYPE, Pokemon_TYPECHART, calculateDamage };
