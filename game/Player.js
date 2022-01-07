import { Pokemon } from "./Pokemon.js";

class Player {
  constructor(obj) {
    this.id = obj.id;

    this.pokemons = [];
    obj.pokemons.forEach((p) => {
      this.pokemons.push(new Pokemon(p));
    });
    this.fighter = pokemons[0];
  }

  get fighter() {
    return this.fighter;
  }
}

export { Player };
