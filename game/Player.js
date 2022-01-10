import { Pokemon } from "./Pokemon.js";

class Player {
  constructor(obj) {
    this.id = obj.id;

    this.pokemons = [];
    for (var idx in obj.pokemons) {
      this.pokemons.push(new Pokemon(obj.pokemons[idx]));
    }
    this.fighterIdx = 0;
    this.fighter = this.pokemons[this.fighterIdx];
  }

  // Switch to next index pokemon
  // If no more to switch, return false (Lose)
  setNextFighter() {
    if (this.fighterIdx >= this.pokemons.length - 1) {
      return false;
    }

    this.fighter = this.pokemons[++this.fighterIdx];
    return true;
  }
}

export { Player };
