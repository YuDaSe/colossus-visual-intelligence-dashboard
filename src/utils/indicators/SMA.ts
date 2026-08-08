export class SMA {
  input = 'price';
  windowLength: number;
  prices: number[];
  result: number;
  age: number;
  sum: number;

  constructor(windowLength: number) {
    this.windowLength = windowLength;
    this.prices = [];
    this.result = 0;
    this.age = 0;
    this.sum = 0;
  }

  update(price: number): void {
    const tail = this.prices[this.age] || 0;
    this.prices[this.age] = price;
    this.sum += price - tail;
    this.result = this.sum / this.prices.length;
    this.age = (this.age + 1) % this.windowLength;
  }
}

export default SMA;
