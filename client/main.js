"use strict";

const app = app || { };

app.main = {
    // canvas drawing elements
  offCanvas: undefined,
  offCtx: undefined,
  canvas: undefined,
  ctx: undefined,
  
    // movement object
  movement: {
    down: false,
    up: false,
    right: false,
    left: false,
  },
  
    // connection information
  socket: undefined,
  id: undefined,
  users: undefined,
  
  addUser: (data) => {
    if (data === undefined) return;
    
    if (!this.users[data.user.info.id]) {
      this.users[data.user.info.id] = data.user;
    }
  },
  
  removeUser: (data) => {
    if (this.users[data.user.info.id]) {
      delete this.users[data.user.info.id];
    }
  },
  
  joinRoom: (data) => {
    if (data === undefined || data.self === undefined || data.others === undefined) return;
    
      // set the user
    this.id = data.self.info.id;
    this.users[this.id] = data.self;
    
      // set the other users in the room
    const keys = Object.keys(data.others);
    for (let i = 0; i < keys.length; i++) {
      this.users[data.others[keys[i]].info.id] = data.others[keys[i]];
    }
  },
  
  update: (data) => {
    if (data.info.id === this.id) {
      return;
    }

    if (this.users[data.info.id].gameData.lastUpdate >= data.gameData.lastUpdate) {
      return;
    }

    const user = this.users[data.info.id];
    user.gameData.a_x = data.gameData.a_x;
    user.gameData.a_y = data.gameData.a_y;
    user.gameData.b_x = data.gameData.b_x;
    user.gameData.b_y = data.gameData.b_y;
    user.gameData.c_x = data.gameData.c_x;
    user.gameData.c_y = data.gameData.c_y;
    user.clientData.alpha = 0.05;
  },
  
  updatePosition: () => {
    const self = this.users[this.id];

    self.gameData.c_x = self.gameData.b_x;
    self.gameData.c_y = self.gameData.b_y;
    self.gameData.b_x = self.clientData.x;
    self.gameData.b_y = self.clientData.y;

    if (this.movement.up && self.gameData.a_y > 0) {
      self.gameData.a_y -= 2;
    }
    if (this.movement.down && self.gameData.a_y < 400) {
      self.gameData.a_y += 2;
    }
    if (this.movement.left && self.gameData.a_x > 0) {
      self.gameData.a_x -= 2;
    }
    if (this.movement.right && self.gameData.a_x < 400) {
      self.gameData.a_x += 2;
    }

    self.clientData.alpha = 0.05;

    this.socket.emit('moveSend', {info: {id: this.id}, gameData: this.users[this.id].gameData} );
  },
  
  
  lerp2: (v0, v1, alpha) => {
    return (1 - alpha) * v0 + alpha * v1;
  },

  lerp3: (v0, v1, v2, alpha) => {
    return (1 - alpha) * ((1 - alpha) * v0 + alpha * v1) + ((1 - alpha) * v1 + v2 * alpha) * alpha;
  },

  redraw: (time) => {
    updatePosition();

    ctx.clearRect(0, 0, 500, 500);

    const keys = Object.keys(users);

    for (let i = 0; i < keys.length; i++) {
      const user = users[keys[i]];

      if (user.clientData.alpha < 1) {
        user.clientData.alpha += 0.05;
      }

      ctx.fillStyle = user.info.color;

      //user.clientData.x = lerp3(user.gameData.c_x, user.gameData.b_x, user.gameData.a_x, user.clientData.alpha);
      //user.clientData.y = lerp3(user.gameData.c_y, user.gameData.b_y, user.gameData.a_y, user.clientData.alpha);

      user.clientData.x = lerp2(user.gameData.c_x, user.gameData.a_x, user.clientData.alpha);
      user.clientData.y = lerp2(user.gameData.c_y, user.gameData.a_y, user.clientData.alpha);
      ctx.beginPath();
      ctx.arc(user.clientData.x, user.clientData.y, 50, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.fill();
    }

    requestAnimationFrame(redraw.bind(this));
  },
  
  init: () => {
    this.canvas = document.querySelector("#canvas");
    this.ctx = canvas.getContext("2d");

    this.socket = io.connect();

    //socket.emit('join', {});

    this.socket.on('joinedRoom', this.joinRoom);

    this.socket.on('userJoined', this.addUser);

    this.socket.on('userLeft', this.removeUser);

    this.socket.on('moveUpdate', this.update);

    document.body.addEventListener('keydown', app.utils.keyDownHandler);
    document.body.addEventListener('keyup', app.utils.keyUpHandler);
  },

};

(window.onload = () => {
  app.main.init();
})();