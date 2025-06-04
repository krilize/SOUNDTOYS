export default class SuperShape {
  constructor(params) {
    Object.assign(this, params);
  }

  supershape(theta) {
    let part1 = Math.abs((1 / this.a) * Math.cos(this.m * theta / 4));
    part1 = Math.pow(part1, this.n2);
  
    let part2 = Math.abs((1 / this.b) * Math.sin(this.m * theta / 4));
    part2 = Math.pow(part2, this.n3);
  
    let denom = Math.pow(part1 + part2, 1 / this.n1);
  
    if (denom === 0) return 0;
    return 1 / denom;
  }
  
  
}
