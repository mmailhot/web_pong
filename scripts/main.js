(function() {
  var Ball, GAME_HEIGHT, GAME_WIDTH, MOUSE_X, MOUSE_Y, O, Paddle, PlayerController, RandomController, SlowTrackerController, ball, bottomWall, camera, clamp, enemyPaddle, leftWall, paddleMaterials, paddleMaterials2, playerPaddle, pointLight, reflectMatrix, renderer, rightWall, scene, shadow, shadowMaterial, shadowTexture, topWall, update;

  O = {
    WIDTH: 900,
    HEIGHT: 600,
    VIEW_ANGLE: 45,
    NEAR: 0.1,
    FAR: 10000
  };

  GAME_WIDTH = 30;

  GAME_HEIGHT = 20;

  MOUSE_X = null;

  MOUSE_Y = null;

  clamp = function(number, min, max) {
    return Math.max(min, Math.min(number, max));
  };

  reflectMatrix = new THREE.Vector4(-1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1);

  Ball = (function() {
    Ball.prototype.object = null;

    function Ball(x, y, z) {
      var x_speed, y_speed, z_speed;
      this.object = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshPhongMaterial({
        color: 0xBBBBBB,
        specular: 0xBBBBBB
      }));
      this.speed = 0.2;
      this.theta = 90;
      this.phi = 12;
      z_speed = this.speed * Math.sin(this.theta * Math.PI / 180) * Math.cos(this.phi * Math.PI / 180);
      x_speed = this.speed * Math.sin(this.theta * Math.PI / 180) * Math.sin(this.phi * Math.PI / 180);
      y_speed = this.speed * Math.cos(this.theta * Math.PI / 180);
      this.velocity = new THREE.Vector3(x_speed, y_speed, z_speed);
    }

    Ball.prototype.update = function(x, y, z) {
      this.object.position.add(this.velocity);
      return this.velocity.multiplyScalar(1.001);
    };

    Ball.prototype.testCollide = function(object) {
      var angle, ray;
      angle = new THREE.Vector3(1 * Math.sin(this.theta * Math.PI / 180) * Math.sin(this.phi * Math.PI / 180), 1 * Math.cos(this.theta * Math.PI / 180), 1 * Math.sin(this.theta * Math.PI / 180) * Math.cos(this.phi * Math.PI / 180));
      ray = new THREE.Raycaster(this.object.position, angle, 0, 0.5 + this.speed);
      return ray.intersectObject(object, true);
    };

    Ball.prototype.transformOnMatrix = function(matrix) {};

    Ball.prototype.tempReverse = function() {
      return this.velocity.z = -this.velocity.z;
    };

    return Ball;

  })();

  Paddle = (function() {
    Paddle.prototype.object = null;

    Paddle.prototype.light = null;

    function Paddle(plane, width, height, color, controller) {
      var materials;
      this.width = width;
      this.height = height;
      this.controller = controller;
      materials = [
        new THREE.MeshLambertMaterial({
          color: color,
          opacity: 0.5,
          transparent: true
        }), new THREE.MeshBasicMaterial({
          color: color,
          wireframe: true
        })
      ];
      this.object = new THREE.SceneUtils.createMultiMaterialObject(new THREE.CubeGeometry(this.width, this.height, 1), materials);
      this.object.position.z = plane;
      this.light = new THREE.PointLight(color, 2);
      this.light.position.z = plane;
    }

    Paddle.prototype.update = function() {
      var newPos;
      newPos = this.controller.update(this.object.position.x, this.object.position.y);
      return this.setPosition(newPos.x, newPos.y);
    };

    Paddle.prototype.setPosition = function(x, y) {
      var xLim, yLim;
      xLim = (GAME_WIDTH - this.width) / 2;
      yLim = (GAME_HEIGHT - this.height) / 2;
      this.object.position.x = clamp(x, -xLim, xLim);
      this.object.position.y = clamp(y, -yLim, yLim);
      this.light.position.x = clamp(x, -xLim, xLim);
      return this.light.position.y = clamp(y, -yLim, yLim);
    };

    return Paddle;

  })();

  RandomController = (function() {
    function RandomController() {}

    RandomController.prototype.update = function(x, y) {
      return {
        x: x + Math.random() - 0.5,
        y: y + Math.random() - 0.5
      };
    };

    return RandomController;

  })();

  SlowTrackerController = (function() {
    SlowTrackerController.prototype.speed = 0.3;

    function SlowTrackerController(object) {
      this.object = object;
    }

    SlowTrackerController.prototype.update = function(x, y) {
      x += clamp(this.object.position.x - x, -this.speed, this.speed);
      y += clamp(this.object.position.y - y, -this.speed, this.speed);
      return {
        x: x,
        y: y
      };
    };

    return SlowTrackerController;

  })();

  PlayerController = (function() {
    function PlayerController() {}

    PlayerController.prototype.update = function(x, y) {
      if (MOUSE_X) {
        x = MOUSE_X / 30 - 15;
      }
      if (MOUSE_Y) {
        y = -(MOUSE_Y / 30 - 10);
      }
      return {
        x: x,
        y: y
      };
    };

    return PlayerController;

  })();

  O.ASPECT = O.WIDTH / O.HEIGHT;

  renderer = new THREE.WebGLRenderer();

  camera = new THREE.PerspectiveCamera(O.VIEW_ANGLE, O.ASPECT, O.NEAR, O.FAR);

  scene = new THREE.Scene();

  scene.add(camera);

  camera.position.z = 55;

  renderer.setSize(O.WIDTH, O.HEIGHT);

  renderer.domElement.setAttribute("id", "canvasId");

  document.getElementById('container').appendChild(renderer.domElement);

  renderer.setClearColorHex(0x000000, 1.0);

  renderer.clear();

  bottomWall = new THREE.Mesh(new THREE.CubeGeometry(32, 1, 60), new THREE.MeshLambertMaterial({
    color: 0x111111
  }));

  bottomWall.position.set(0, -10.5, 0);

  scene.add(bottomWall);

  topWall = new THREE.Mesh(new THREE.CubeGeometry(32, 1, 60), new THREE.MeshLambertMaterial({
    color: 0x111111
  }));

  topWall.position.set(0, 10.5, 0);

  scene.add(topWall);

  leftWall = new THREE.Mesh(new THREE.CubeGeometry(1, 20, 60), new THREE.MeshLambertMaterial({
    color: 0x111111
  }));

  leftWall.position.set(-15.5, 0, 0);

  scene.add(leftWall);

  rightWall = new THREE.Mesh(new THREE.CubeGeometry(1, 20, 60), new THREE.MeshLambertMaterial({
    color: 0x111111
  }));

  rightWall.position.set(15.5, 0, 0);

  scene.add(rightWall);

  paddleMaterials = [
    new THREE.MeshLambertMaterial({
      color: 0xFF7F00,
      opacity: 0.5,
      transparent: true
    }), new THREE.MeshBasicMaterial({
      color: 0xFF7F00,
      wireframe: true
    })
  ];

  paddleMaterials2 = [
    new THREE.MeshLambertMaterial({
      color: 0x0080FF,
      opacity: 0.5,
      transparent: true
    }), new THREE.MeshBasicMaterial({
      color: 0x0080FF,
      wireframe: true
    })
  ];

  ball = new Ball(0, 0, 0);

  scene.add(ball.object);

  playerPaddle = new Paddle(29.5, 6, 5, 0xFF7F00, new PlayerController);

  scene.add(playerPaddle.object);

  scene.add(playerPaddle.light);

  enemyPaddle = new Paddle(-29.5, 6, 5, 0x0080FF, new SlowTrackerController(ball.object));

  scene.add(enemyPaddle.object);

  scene.add(enemyPaddle.light);

  pointLight = new THREE.PointLight(0xFF7F00, 0);

  pointLight.position.set(0, 0, 0);

  scene.add(pointLight);

  shadowTexture = THREE.ImageUtils.loadTexture('../img/shadow.png');

  shadowMaterial = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true
  });

  shadow = new THREE.Mesh(new THREE.CubeGeometry(1, 0.0001, 1), shadowMaterial);

  shadow.position.set(0, -9.9, 0);

  scene.add(shadow);

  renderer.render(scene, camera);

  document.getElementById('canvasId').onmousemove = function(e) {
    MOUSE_X = e.pageX - this.offsetLeft;
    return MOUSE_Y = e.pageY - this.offsetTop;
  };

  update = function() {
    var a, b;
    enemyPaddle.update();
    playerPaddle.update();
    a = ball.testCollide(playerPaddle.object);
    b = ball.testCollide(enemyPaddle.object);
    if (a.length > 0 || b.length > 0) {
      ball.tempReverse();
    }
    ball.update();
    shadow.position.x = ball.object.position.x;
    shadow.position.z = ball.object.position.z;
    renderer.render(scene, camera);
    return requestAnimationFrame(update);
  };

  requestAnimationFrame(update);

}).call(this);
