const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const utils = require('./utils.js');
const Room = require('./Room.js');
// const Vector2 = require('./Vector2.js');

const time = new Date();

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const handler = (req, res) => {
  const url = req.url;

  switch (url) {
    default:
    case '/':
      fs.readFile(`${__dirname}/../client/index.html`, (err, data) => {
        // if err, throw it for now
        if (err) {
          throw err;
        }
        res.writeHead(200);
        res.end(data);
      });
      break;
    case '/app.js':
      fs.readFile(`${__dirname}/../client/app.js`, (err, data) => {
        // if err, throw it for now
        if (err) {
          throw err;
        }
        res.writeHead(200);
        res.end(data);
      });
      break;
    case '/utils.js':
      fs.readFile(`${__dirname}/../client/utils.js`, (err, data) => {
        // if err, throw it for now
        if (err) {
          throw err;
        }
        res.writeHead(200);
        res.end(data);
      });
      break;
  }
};

const app = http.createServer(handler).listen(port);

console.log(`Listening on localhost:${port}`);


// * ISSUES *//
//    Server doesn't care if two users have the same name
//    Failure states are built in but not used


// pass in the http server into socketio and grab the websocket server
const io = socketio(app);

// object to hold all of our connected users
// const users = { };

// array of all the rooms on the server
  // rooms are created randomly OR when a player joins a specific room
    // rooms are limited to 4 players
    // private rooms are set by players inputting a specific name in
    // random rooms are set by players joining any room
const rooms = { private: {}, public: {} };

// function that returns a random room name if it can find one that's not filled
  // if it can't find one, it will generate a new room
const findRandomRoom = () => {
  const keys = Object.keys(rooms.public);

  if (keys.length === 0) {
    // no rooms on the server to publicly join
    const name = utils.randRoomName();
    rooms.public[name] = new Room(name, io);
    return name;
  }
    // return the first empty room
  for (let i = 0; i < keys.length; i++) {
    if (!rooms.public[keys[i]].isFull()) {
      return keys[i];
    }
  }

    // if no rooms were found to be empty, make a new one
  const name = utils.randRoomName();
  rooms.public[name] = new Room(name, io);
  return name;
};

// * Socket data structure * //
//    socket
//    \_userData
//      |_info          stores user information (transferred once)
//      | |_id
//      | |_name
//      | |_color
//      | |_private
//      | \_room
//      |_gameData      stores user's synched game information (transferred constantly)
//      | |               gets transferred by the server to the clients
//      | |_physics     not transferred, serverside physics information
//      | | |_forces
//      | | |_acceleration
//      | | |_velocity
//      | | |_friction
//      | | \_masss
//      | |_lastUpdate
//      | |_a_x
//      | |_a_y
//      | |_b_x
//      | |_b_y
//      | |_c_x
//      | |_c_y
//      | |_colliding
//      | |_boosting
//      | |_sunken
//      | |_sinking
//      | \_sinkProgress
//      |_clientData    stores user's client game information (transferred once)
//      | |_movement      not transferred
//      | | |               gets updated by the clients messages back to the server
//      | | |_sink
//      | | |_boost
//      | | |_up
//      | | |_down
//      | | |_left
//      | | \_right
//      | |_alpha
//      | |_x
//      | \_y
//      \_serverData    stores timing properties on the user abilities
//        |_boostTimer
//        |_boostRefreshTimer
//        |_sinkTimer
//        \_sinkRefreseTimer

// * Input structure * //
//    data
//    |_info
//    | \_id
//    \_movement
//      |_boost
//      |_sink
//      |_up
//      |_down
//      |_left
//      \_right

// * Joined Handler * //
  // This handler triggers when a player joins a room, or tries to
    // The player doesn't really "connect" to the server until this happens
    // This handler will create new rooms if needed
const onJoined = (sock) => {
  const socket = sock;

  // data object should come with
    // room: string of the chosen room (optional)
  socket.on('join', (data) => {
      // new user to set up and join
    const newUser = { };

      // information about the user that stays the same throughout their time in the room
        // this is info like their name and color
        // this info only gets transferred once to each member of the room
    newUser.info = { };

      // information about the user that changes throughout the game
        // this info gets transferred all the time once the game starts
    newUser.gameData = { };

      // information about the user that affects game data
        // this info only gets transferred once, but affects the game data
        // things in this object change clientside, but aren't corrected by the server
    newUser.clientData = { };

      // set the id of the user (should always be unique)
    newUser.info.id = socket.id;

      // set "unique" name
    newUser.info.name = utils.randName(socket.id);

      // assign them a random color for now
    newUser.info.color = utils.randCol();

      // set some stuff that will change clientside but never be transferred again
    newUser.clientData.alpha = 0.05;
    newUser.clientData.x = 0;
    newUser.clientData.y = 0;

      // set the game data
    newUser.gameData.lastUpdate = time.getTime();
      // using three frame lerping
    newUser.gameData.a_x = 100;
    newUser.gameData.a_y = 100;
    newUser.gameData.b_x = 100;
    newUser.gameData.b_y = 100;
    newUser.gameData.c_x = 100;
    newUser.gameData.c_y = 100;
      // add a collision flag
    newUser.gameData.colliding = false;
      // add ability flags
    newUser.gameData.boosting = false;
    newUser.gameData.sunken = false;
    newUser.gameData.sinking = false;
    newUser.gameData.sinkProgress = 0;

      // assign the data to the socket
    socket.userData = newUser;

      // assign the user the requested room
        // if they didn't send a room, join a random one
    if (data.room.length > 0) {
        // try to get the user into a private room

      if (rooms.private[data.room]) {
          // existing room, try to join

        if (rooms.private[data.room].isFull) {
            // if we're here, the player tried to join a full room
            // we'll tell them it was full and bump them out
              // send back the name of the room to let them know
          socket.emit('fullRoom', { name: data.room });
        }
      } else {
          // room doesn't exist, create it and add the user

        rooms.private[data.room] = new Room(data.room, io);
      }
        // add the user to the room we found or created
      newUser.info.room = data.room;
      newUser.info.private = true;
      rooms.private[data.room].addUser(socket);

        // call the physics start method
      rooms.private[data.room].startPhysics();
    } else {
        // no specified room, join a random public one
      const roomToJoin = findRandomRoom();
      newUser.info.room = roomToJoin;
      newUser.info.private = false;
      rooms.public[roomToJoin].addUser(socket);

        // call the physics start method
      rooms.public[roomToJoin].startPhysics();
    }

      // final steps
    socket.userData.clientData.movement = {
      boost: false,
      sink: false,
      up: false,
      down: false,
      left: false,
      right: false,
    };

    socket.userData.gameData.physics = {
      forces: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      velocity: { x: 250, y: 250 },  // initialize the velocity so we fly out
      friction: 3,   // between 1 and 5
      mass: 1,
    };

      // create a server data section on the user
        // used for timing purposes on the abilities
    socket.userData.serverData = {
      boostTimer: 0,
      boostRefreshTimer: 0,
      sinkTimer: 0,
      sinkRefreshTimer: 0,
    };


    console.log(`${newUser.info.name} joined ${newUser.info.room}`);
  });
};

const onLeave = (sock) => {
  const socket = sock;

  socket.on('leftRoom', () => {
    if (socket.userData === undefined) {
      console.log(`${socket.id} left the room with no data`);
      return;
    }

    if (socket.userData.info.private) {
        // user was in a private room
      const status = rooms.private[socket.userData.info.room].removeUser(socket);

      console.log(`${socket.userData.info.name} left the room`);
      console.log(`Users left in room: ${rooms.private[socket.userData.info.room].getUserCount()}`);

      if (status === 0) {
        rooms.private[socket.userData.info.room].stopPhysics();
        delete rooms.private[socket.userData.info.room];
        console.log(`Deleting room ${socket.userData.info.room}`);
      }
    } else {
        // user in a public room
      const status = rooms.public[socket.userData.info.room].removeUser(socket);

      console.log(`${socket.userData.info.name} left the room`);
      console.log(`Users left in room: ${rooms.public[socket.userData.info.room].getUserCount()}`);

      if (status === 0) {
        rooms.public[socket.userData.info.room].stopPhysics();
        delete rooms.public[socket.userData.info.room];
        console.log(`Deleting room ${socket.userData.info.room}`);
      }
    }
  });
};

const onMove = (sock) => {
  const socket = sock;

  socket.on('moveSend', (data) => {
    const t = new Date();

    socket.userData.gameData = data.gameData;
    socket.userData.gameData.lastUpdate = t.getTime();

    socket.broadcast.to(socket.userData.info.room).emit('moveUpdate', {
      info: { id: socket.id },
      gameData: socket.userData.gameData,
    });
  });
};

const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
    if (socket.userData === undefined || socket.userData.info === undefined) {
      console.log(`${socket.id} disconnected with no data`);
      return;
    }

    if (socket.userData.info.private) {
        // user was in a private room
      const status = rooms.private[socket.userData.info.room].removeUser(socket);

      console.log(`${socket.userData.info.name} disconnected and left the room`);
      console.log(`Users left in room: ${rooms.private[socket.userData.info.room].getUserCount()}`);

      if (status === 0) {
        rooms.private[socket.userData.info.room].stopPhysics();
        delete rooms.private[socket.userData.info.room];
        console.log(`Deleting room ${socket.userData.info.room}`);
      }
    } else {
        // user in a public room
      const status = rooms.public[socket.userData.info.room].removeUser(socket);

      console.log(`${socket.userData.info.name} disconnected and left the room`);
      console.log(`Users left in room: ${rooms.public[socket.userData.info.room].getUserCount()}`);

      if (status === 0) {
        rooms.public[socket.userData.info.room].stopPhysics();
        delete rooms.public[socket.userData.info.room];
        console.log(`Deleting room ${socket.userData.info.room}`);
      }
    }
  });
};

const onInput = (sock) => {
  const socket = sock;

  socket.on('inputSend', (data) => {
    socket.userData.clientData.movement = data.data;
  });
};

io.sockets.on('connection', (socket) => {
  console.log('Connection started');

  onLeave(socket);
  onJoined(socket);
  onMove(socket);
  onInput(socket);
  onDisconnect(socket);
});


console.log('Websocket server started.');
