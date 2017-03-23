class Vector2 {

  constructor(x, y) {
    if (x === undefined) {
      this.x = 0;
    } else {
      this.x = parseFloat(x);

      if (isNaN(this.x)) {
        this.x = 0;
      }
    }

    if (y === undefined) {
      this.y = 0;
    } else {
      this.y = parseFloat(y);

      if (isNaN(this.y)) {
        this.y = 0;
      }
    }
  }

  getX() {
    return this.x;
  }

  getY() {
    return this.y;
  }

  setX(x) {
    if (x === undefined) {
      return;
    }
    this.x = parseFloat(x);

    if (isNaN(this.x)) {
      this.x = 0;
    }
  }

  setY(y) {
    if (y === undefined) {
      return;
    }
    this.y = parseFloat(y);

    if (isNaN(this.y)) {
      this.y = 0;
    }
  }

  static distance(vec1, vec2) {
    return Math.sqrt(((vec1.getX() - vec2.getX()) ** 2) + ((vec1.getY() - vec2.getY()) ** 2));
  }

  // static dot(vec1, vec2) {
//
  // }

  static normalize(vec1) {
    const mag = Vector2.magnitude(vec1);
    return new Vector2(vec1.getX() / mag, vec1.getY() / mag);
  }

  static magnitude(vec1) {
    return Math.sqrt((vec1.getX() ** 2) + (vec1.getY() ** 2));
  }
}

module.exports = Vector2;
