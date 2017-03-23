// const Vector2 = require('./Vector2.js');

class Physics {

  constructor(freq) {
    this.frequency = freq;

    const time = new Date();

    this.lastTime = time.getTime();
    this.dT = 0;
  }


  // takes the user data and ids
    // simulates the physics of them
      // includes collisions, movements, etc
    // changes the values on the server for each
  simulate(users, data) {
      // update deltaTime
    const time = new Date();
    const curTime = time.getTime();
    this.dT = (curTime - this.lastTime) / 1000;
    this.lastTime = curTime;

      // parameters for abilities (in seconds)
    const timeToSink = 1.5;
    const timeSunken = 1.5;
    const sinkRefresh = 5;
    const sinkWeight = 10;
    const boostAmt = 10;
    const boostTime = 0.5;
    const boostRefresh = 5;
    const boostWeight = 2;


      // get keys
    const dataKeys = Object.keys(data);
      // reset forces and acceleration
    for (let i = 0; i < dataKeys.length; i++) {
      const user = data[dataKeys[i]];
      user.gameData.physics.forces = { x: 0, y: 0 };
      user.gameData.physics.acceleration = { x: 0, y: 0 };
      user.gameData.colliding = false;

        // handle boosting
          // user currently boosting
      if (user.serverData.boostTimer > 0) {
        user.serverData.boostTimer -= this.dT;

        if (user.serverData.boostTimer <= 0) {
          user.gameData.boosting = false;
          user.gameData.physics.mass = 1;
          user.serverData.boostTimer = 0;
          user.serverData.boostRefreshTimer = boostRefresh;
        }
      } else if (user.serverData.boostRefreshTimer > 0) {
          // user refreshing their boost
        user.serverData.boostRefreshTimer -= this.dT;

        if (user.serverData.boostRefreshTimer <= 0) {
          user.serverData.boostRefreshTimer = 0;
        }
      } else if (user.clientData.movement.boost &&
                !user.gameData.sinking) {
          // user getting to boost again
        user.serverData.boostTimer = boostTime;
        user.gameData.boosting = true;
        user.gameData.physics.mass = boostWeight;
      }

        // handle sinking
          // user currently using the 'sink' ability
      if (user.gameData.sinking) {
          // user currently sinking down
        if (user.gameData.sinkProgress < timeToSink &&
            user.serverData.sinkTimer === 0 &&
            user.serverData.sinkRefreshTimer === 0) {
          user.gameData.sinkProgress += this.dT;
          user.gameData.physics.mass = 1 + (user.gameData.sinkProgress * sinkWeight);

          if (user.gameData.sinkProgress >= timeToSink) {
            user.gameData.sinkProgress = timeToSink;
            user.gameData.physics.mass = 1 + sinkWeight;
            user.gameData.sunken = true;
            user.serverData.sinkTimer = timeSunken;
          }
        } else if (user.serverData.sinkTimer > 0) {
            // user currently sunken
          user.serverData.sinkTimer -= this.dT;

          if (user.serverData.sinkTimer <= 0) {
            user.serverData.sinkTimer = 0;
            user.serverData.sinkRefreshTimer = sinkRefresh;
            user.gameData.sunken = false;
          }
        } else if (user.serverData.sinkRefreshTimer > 0) {
            // user not sunken anymore
          if (user.gameData.sinkProgress > 0) {
            user.gameData.sinkProgress -= this.dT;
            user.gameData.physics.mass = 1 + (user.gameData.sinkProgress * boostWeight);
            console.log(user.gameData.sinkProgress);

            if (user.gameData.sinkProgress <= 0) {
              user.gameData.sinkProgress = 0;
              user.gameData.physics.mass = 1;
            }
          }

          user.serverData.sinkRefreshTimer -= this.dT;

          if (user.serverData.sinkRefreshTimer <= 0) {
            user.serverData.sinkRefreshTimer = 0;
            user.gameData.sinking = false;
          }
        }
      } else if (user.clientData.movement.sink &&
                !user.gameData.boosting) {
          // user activates ability
        user.gameData.sinking = true;
      }
    }
      // handle movement updating
    for (let i = 0; i < dataKeys.length; i++) {
      const user = data[dataKeys[i]];
      const gameData = user.gameData;

        // check if the user is sunken
          // skip physics if it is
      if (!gameData.sunken) {
          // adjust lastTime updated
        gameData.lastUpdate = curTime;


        let boostMod = 1;
          // check for boosting
        if (gameData.boosting) {
          boostMod = boostAmt;
        }

          // add forces
        if (user.clientData.movement.up) {
          gameData.physics.forces.y -= 1000 * boostMod;
        }
        if (user.clientData.movement.down) {
          gameData.physics.forces.y += 1000 * boostMod;
        }
        if (user.clientData.movement.left) {
          gameData.physics.forces.x -= 1000 * boostMod;
        }
        if (user.clientData.movement.right) {
          gameData.physics.forces.x += 1000 * boostMod;
        }

          // add friction
            // if the velocity is small enough, flatten it
        if (Math.abs(gameData.physics.velocity.x) < 0.1) {
          gameData.physics.velocity.x = 0;
        } else {
          gameData.physics.forces.x -= gameData.physics.velocity.x *
            gameData.physics.friction;
        }

        if (Math.abs(gameData.physics.velocity.y) < 0.1) {
          gameData.physics.velocity.y = 0;
        } else {
          gameData.physics.forces.y -= gameData.physics.velocity.y *
            gameData.physics.friction;
        }

          // check collisions and add calculate physics
        for (let j = i + 1; j < dataKeys.length; j++) {
          const other = data[dataKeys[j]].gameData;

            // check to see if the other user is sunken
              // skip them if they are
          if (!other.sunken) {
            const dist = Math.sqrt(((gameData.a_x - other.a_x) ** 2) +
                                   ((gameData.a_y - other.a_y) ** 2));

            if (dist < 100) {
              gameData.colliding = true;
              other.colliding = true;

                // objects to use for collision calculation
              const obj1 = { };
              const obj2 = { };

                // calculate combined mass
              const combMass = gameData.physics.mass + other.physics.mass;

                // calculate mass scalars
              obj1.massScalar = (2 * other.physics.mass) / combMass;
              obj2.massScalar = (2 * gameData.physics.mass) / combMass;

                // calculate velocity differences
              obj1.velDiff = {
                x: gameData.physics.velocity.x - other.physics.velocity.x,
                y: gameData.physics.velocity.y - other.physics.velocity.y,
              };
              obj2.velDiff = {
                x: other.physics.velocity.x - gameData.physics.velocity.x,
                y: other.physics.velocity.y - gameData.physics.velocity.y,
              };

                // calculate position differences
              obj1.posDiff = {
                x: gameData.a_x - other.a_x,
                y: gameData.a_y - other.a_y,
              };
              obj2.posDiff = {
                x: other.a_x - gameData.a_x,
                y: other.a_y - gameData.a_y,
              };

                // calculate the dot products
              obj1.dot = ((obj1.velDiff.x * obj1.posDiff.x) + (obj1.velDiff.y * obj1.posDiff.y));
              obj2.dot = ((obj2.velDiff.x * obj2.posDiff.x) + (obj2.velDiff.y * obj2.posDiff.y));

                // calculate sqrMag
              obj1.sqrMag = (obj1.posDiff.x ** 2) + (obj1.posDiff.y ** 2);
              obj2.sqrMag = (obj2.posDiff.x ** 2) + (obj2.posDiff.y ** 2);

                // calculate final scaler
              obj1.scalar = (obj1.massScalar * obj1.dot) / obj1.sqrMag;
              obj2.scalar = (obj2.massScalar * obj2.dot) / obj2.sqrMag;

                // calculate changed velocities
                  // I add a 10% increase fudge factor to make sure
                  //  the objects don't stick inside each other
              obj1.newVel = {
                x: gameData.physics.velocity.x - (obj1.scalar * obj1.posDiff.x * 1.1),
                y: gameData.physics.velocity.y - (obj1.scalar * obj1.posDiff.y * 1.1),
              };
              obj2.newVel = {
                x: other.physics.velocity.x - (obj2.scalar * obj2.posDiff.x * 1.1),
                y: other.physics.velocity.y - (obj2.scalar * obj2.posDiff.y * 1.1),
              };

                // calculate directions
              obj1.dir = {
                x: (obj1.newVel.x < 0 ? -1 : 1),
                y: (obj1.newVel.y < 0 ? -1 : 1),
              };
              obj2.dir = {
                x: (obj2.newVel.x < 0 ? -1 : 1),
                y: (obj2.newVel.y < 0 ? -1 : 1),
              };

                // calculate forces required to change velocities
              obj1.df = {
                x: 0.5 * gameData.physics.mass * (obj1.newVel.x ** 2) * obj1.dir.x,
                y: 0.5 * gameData.physics.mass * (obj1.newVel.y ** 2) * obj1.dir.y,
              };
              obj2.df = {
                x: 0.5 * other.physics.mass * (obj2.newVel.x ** 2) * obj2.dir.x,
                y: 0.5 * other.physics.mass * (obj2.newVel.y ** 2) * obj2.dir.y,
              };

                // add forces
             // gameData.physics.forces.x -= obj1.df.x;
             // gameData.physics.forces.y -= obj1.df.y;
             //
             // other.physics.forces.x -= obj2.df.x;
             // other.physics.forces.y -= obj2.df.y;

              gameData.physics.velocity.x = obj1.newVel.x;
              gameData.physics.velocity.y = obj1.newVel.y;

              other.physics.velocity.x = obj2.newVel.x;
              other.physics.velocity.y = obj2.newVel.y;
            }
          }
        }

          // calculate wall bounces
        if (gameData.a_x >= 800 || gameData.a_x <= 0) {
          gameData.physics.velocity.x *= -1;
        }
        if (gameData.a_y >= 800 || gameData.a_y <= 0) {
          gameData.physics.velocity.y *= -1;
        }

          // calculate acceleration
        gameData.physics.acceleration.x = gameData.physics.forces.x / gameData.physics.mass;
        gameData.physics.acceleration.y = gameData.physics.forces.y / gameData.physics.mass;

          // calculate velocity
        gameData.physics.velocity.x += gameData.physics.acceleration.x * this.dT;
        gameData.physics.velocity.y += gameData.physics.acceleration.y * this.dT;

          // calculate the slowing from sinking
        gameData.physics.velocity.x *= Math.max(0,
                                                (timeToSink - (gameData.sinkProgress * 0.5)));
        gameData.physics.velocity.y *= Math.max(0,
                                                (timeToSink - (gameData.sinkProgress * 0.5)));

          // update positions
        gameData.c_x = gameData.b_x;
        gameData.c_y = gameData.b_y;
        gameData.b_x = gameData.a_x;
        gameData.b_y = gameData.a_y;
        gameData.a_x += gameData.physics.velocity.x * this.dT;
        gameData.a_y += gameData.physics.velocity.y * this.dT;

        // console.dir(gameData);
      }
    }
  }

}

module.exports = Physics;
