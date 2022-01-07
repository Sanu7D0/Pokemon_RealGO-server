class Pokemon {
  constructor(obj) {
    this.maxHp = obj.maxHp;
    this.hp = this.maxHp;
    this.level = obj.level;
    this.type1 = obj.type1;
    this.type2 = obj.type2;
    this.skills = [];
    this.skills.forEach((skill) => {
      this.skills.push(new Skill(skill));
    });
    this.nextSkill = null;
  }

  selectSkill(idx) {
    this.nextSkill = this.skills[idx];
  }

  getDamage(dmg) {
    this.hp -= dmg;
    if (hp <= 0) {
      this.die();
    }
  }

  restoreHealth(heal) {
    this.hp += heal;
    this.hp = Math.min(this.maxHp, this.hp);
  }

  die() {}
}

class Skill {
  constructor(skill) {
    this.type = skill.type;
    this.power = skill.power;
    this.category = skill.category;
    this.acc = skill.acc;
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
  attack,
  defense
) {
  let mod1 = 1.0;
  let mod2 = 1.0;
  let mod3 = 1.0;
  const critical = 1.0;

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

  Pokemon_TYPECHART[attackerType][defenserType];
  const random = Math.random(0.85, 1);
  return (
    ((((((level * 2) / 5 + 2) * power * attack) / defense / 50) * mod1 + 2) *
      mod2 *
      critical *
      typeEffectness1 *
      typeEffectness2 *
      random) /
    100
  );
};

export { Pokemon, Pokemon_TYPE, Pokemon_TYPECHART, calculateDamage };
