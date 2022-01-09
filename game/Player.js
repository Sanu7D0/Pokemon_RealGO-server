import { Pokemon } from "./Pokemon.js";

class Player {
  constructor(obj) {
    this.id = obj.id;

    this.pokemons = [];
    for (var idx in obj.pokemons) {
      this.pokemons.push(new Pokemon(obj.pokemons[idx]));
    }
    this.fighter = this.pokemons[0];
  }
}

export { Player };
