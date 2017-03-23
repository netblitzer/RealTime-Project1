const app = app || { };

app.utils = {
  keyDownHandler: (e) => {
    var keyPressed = e.which;

    // W OR UP
    if(keyPressed === 87 || keyPressed === 38) {
      app.main.movement.Up = true;
    }
    // A OR LEFT
    else if(keyPressed === 65 || keyPressed === 37) {
      app.main.movement.Left = true;
    }
    // S OR DOWN
    else if(keyPressed === 83 || keyPressed === 40) {
      app.main.movement.Down = true;
    }
    // D OR RIGHT
    else if(keyPressed === 68 || keyPressed === 39) {
      app.main.movement.Right = true;
    }

    e.preventDefault();
  },

  keyUpHandler: (e) => {
    var keyPressed = e.which;

    // W OR UP
    if(keyPressed === 87 || keyPressed === 38) {
      app.main.movement.Up = false;
    }
    // A OR LEFT
    else if(keyPressed === 65 || keyPressed === 37) {
      app.main.movement.Left = false;
    }
    // S OR DOWN
    else if(keyPressed === 83 || keyPressed === 40) {
      app.main.movement.Down = false;
    }
    // D OR RIGHT
    else if(keyPressed === 68 || keyPressed === 39) {
      app.main.movement.Right = false;
    }       

    e.preventDefault();
  },
};