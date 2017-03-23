
// function to generate random colors
const randCol = () => {
    // create random colors
  let R = Math.round(Math.random() * 255);
  let G = Math.round(Math.random() * 255);
  let B = Math.round(Math.random() * 255);

    // find which one is largest
  const max = Math.max(R, G, B);
    // find the difference needed to get it to 255
  const diff = 255 - max;

    // add the difference to all of them
  R += diff;
  G += diff;
  B += diff;

    // return the completed color
  return `rgb(${R}, ${G}, ${B})`;
};

// function to generate random names
const randName = () => {
  const time = new Date();

  return `User${Math.round(time.getTime() * Math.random()) % 10000000}`;
};

// function to generate random room names
const randRoomName = () => {
  const time = new Date();
  return `Room${Math.round(time.getTime()) % 10000000}`;
};


// Export the functions
module.exports = {
  randCol,
  randName,
  randRoomName,
};
