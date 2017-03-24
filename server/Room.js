const Physics = require('./Physics.js');

class Room {

  constructor(name, _io) {
    this.name = name;
    this.maxSize = 5; // Max users allowed
    this.users = {};
    this.usersData = {};
    this.currentUsers = 0;
    this.physics = new Physics(17);
    this.intervalID = -1;
    this.io = _io;
  }

  // takes the socket to add
    // will return false if the join attempt fails
  addUser(socket) {
    // check if the room is already full
    if (this.currentUsers >= this.maxSize) {
      return false;
    }
      // check if the socket is already in the room and tried to join again somehow
    if (this.users[socket.id] != null) {
      return false;
    }
        // socket successfully can join
    socket.join(this.name);

        // tell the socket who else is here and themselves
    socket.emit('joinedRoom', {
      type: 'success',
      others: this.usersData,
      self: socket.userData,
    });
        // tell everyone else about the socket joining
    socket.broadcast.to(this.name).emit('userJoined', { type: 'success', user: socket.userData });

        // store the socket info now
    this.users[socket.id] = socket;
    this.usersData[socket.id] = socket.userData;

        // increment the currentusers
    this.currentUsers++;

    return true;
  }

  // takes the socket to remove
    // returns -1 if it fails
    // returns 0 if there's no players left in the room (flag for deletion)
    // returns 1 if there are players in the room
  removeUser(socket) {
      // check if the socket is in the room to remove it
    if (this.users[socket.id] === null) {
        // return false if the socket isn't even in the room
      return -1;
    }

      // remove the socket from the websocket room
    socket.leave(this.name);

      // tell everyone else about the socket leaving
    socket.broadcast.to(this.name).emit('userLeft', { type: 'success', user: this.usersData[socket.id] });

      // remove the socket from the room's data
    delete this.usersData[socket.id];
    delete this.users[socket.id];

      // increment the currentusers
    this.currentUsers--;

      // return 0 if the room is now empty
    if (this.currentUsers < 1) {
      return 0;
    }
    return 1;
  }

  // function to return all the user sockets in the room
  getRoomUsers() {
    return this.users;
  }

  getUserCount() {
    return this.currentUsers;
  }

  // function to see if the room is full
  isFull() {
    if (this.currentUsers >= this.maxSize) {
      return true;
    }

    return false;
  }

  // function to start the physics of the room
  startPhysics() {
    if (this.intervalID < 0) {
      this.intervalID = setInterval(this.runPhysics.bind(this), 17);
    }
  }

  // function to stop the physics of the room
  stopPhysics() {
    if (this.intervalID > -1) {
      clearInterval(this.intervalID);
    }
  }

  // function to continuously simulate and update the physics of the room
  runPhysics() {
    this.physics.simulate(this.users, this.usersData);
    // this.Physics.sendUpdate(this.users, this.usersData, this.name, this.io);


      // get keys
    const dataKeys = Object.keys(this.usersData);
    // const userKeys = Object.keys(users);

      // send updates

      // pack the data into one object
    const packedData = { };

    for (let i = 0; i < dataKeys.length; i++) {
      packedData[dataKeys[i]] = this.usersData[dataKeys[i]].gameData;
      // delete packedData[dataKeys[i]].physics;
    }

    this.io.sockets.in(this.name).emit('postUpdate', {
      type: 'success',
      data: packedData,
    });
  }
}

module.exports = Room;
