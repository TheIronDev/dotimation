/**
 * Class that represents a thing rendered.
 */
class RenderObject {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.size = 5;
    this.height = height;
    this.width = width;
  }

  /**
   * Renders the object onto the canvas
   */
  draw() {
    this.ctx.fillRect(this.x, this.y, this.size, this.size);
  }

  /**
   * Resize the object based on the new width/height
   * @param height
   * @param width
   */
  resizeUpdate(height, width) {
    // 2d resize updates
    this.height = height;
    this.width = width;
    this.x = Math.random() * width;
    this.y = Math.random() * height;

    // 3d resize updates
    this.perspective = this.width * 0.8;
    this.projection_center_x = this.width / 2;
    this.projection_center_y = this.height / 2;
  }

  update() {}
}

/**
 * Demo RenderObject that displays a dot on a circle
 */
class CircleDot extends RenderObject {
  constructor(ctx, width, height) {
    super(ctx, width, height);

    this.x = 0;
    this.y = 0;
    this.angle = Math.floor(Math.random() * 360);
    this.radius = width / 4;
  }
  update() {
    this.angle += 1;
  }
  project() {
    const theta = this.angle * Math.PI / 180;

    this.x = this.radius * Math.cos(theta) + this.width / 2;
    this.y = this.radius * Math.sin(theta) + this.height / 2;
  }
  draw() {
    this.project();

    this.ctx.beginPath();
    const arc = [
      this.x,
      this.y,
      3,
      0,
      2 * Math.PI
    ];
    this.ctx.arc(...arc);
    this.ctx.fill();
  }
}


/**
 * Demo RenderObject that displays a dot on a globe
 */
class SlantedCircleDot extends RenderObject {
  constructor(ctx, width, height) {
    super(ctx, width, height);

    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.theta = Math.floor(Math.random() * 360);
    this.phi = 45;
    this.radius = width / 4;

    this.perspective = 0;
    this.projection_center_x = this.width / 2;
    this.projection_center_y = this.height / 2;

    this.scaleProjected = 0;
    this.xProjected = 0;
    this.yProjected = 0;
  }
  update() {
    this.theta += .01;
  }
  project() {

    this.x = this.width / 3 * Math.sin(this.phi) * Math.cos(this.theta);
    this.y = this.height / 2 * Math.sin(this.phi);
    this.z = this.width / 3 * Math.sin(this.phi) * Math.sin(this.theta) + this.width / 3;

    this.perspective = this.width * .8;

    this.scaleProjected = this.perspective / (this.perspective + this.z); // distance from user
    this.xProjected = (this.x * this.scaleProjected) + this.projection_center_x; // x position on 2d plane
    this.yProjected = (this.y * this.scaleProjected) + this.projection_center_y  / 2; // y pos. on 2d plane
  }
  draw() {
    this.project();
    this.ctx.globalAlpha = Math.abs(1 - this.z / this.width);

    this.ctx.beginPath();
    const arc = [
      this.xProjected,
      this.yProjected,
      5 * this.scaleProjected,
      0,
      2 * Math.PI
    ];
    this.ctx.arc(...arc);
    this.ctx.fill();
  }
}

/**
 * Demo RenderObject that displays a dot on a globe
 */
class GlobeDot extends RenderObject {
  constructor(ctx, width, height) {
    super(ctx, width, height);

    this.x = (Math.random() - 0.5) * width;
    this.y = (Math.random() - 0.5) * height;
    this.z = (Math.random() - 0.5) * height;

    this.perspective = this.width * 0.8;
    this.projection_center_x = this.width / 2;
    this.projection_center_y = this.height / 2;

    this.scaleProjected = 0;
    this.xProjected = 0;
    this.yProjected = 0;

    this.theta = Math.random() * 2 * Math.PI; // Random value between [0, 2Pi]
    this.phi = Math.acos((Math.random() * 2) - 1); // Random value between [0, Pi]
  }
  update() {
    this.theta += .01;
  }
  project() {
    // Calculate the x, y, z coordinates in the 3D world
    this.x = this.width / 3 * Math.sin(this.phi) * Math.cos(this.theta);
    this.y = this.width / 3 * Math.cos(this.phi);
    this.z = this.width / 3 * Math.sin(this.phi) * Math.sin(this.theta) + this.width / 3;
    this.perspective = this.width * 0.8;

    this.scaleProjected = this.perspective / (this.perspective + this.z); // distance from user
    this.xProjected = (this.x * this.scaleProjected) + this.projection_center_x; // x position on 2d plane
    this.yProjected = (this.y * this.scaleProjected) + this.projection_center_y; // y pos. on 2d plane
  }
  draw() {
    this.project();
    this.ctx.globalAlpha = Math.abs(1 - this.z / this.width);

    const radius = 5 * this.scaleProjected;

    // this.ctx.fillRect(this.xProjected, this.yProjected, radius, radius); // Faster performance
    this.ctx.drawImage(this.ctx.canvas.particle, this.xProjected, this.yProjected, radius, radius);
  }
}

class CanvasScene {
  constructor(
      canvas,
      renderObjectCount = 100,
      renderObjectClass = RenderObject
  ) {
    this.lastDrawTime = 0;
    this.fps = 0;

    // Pre-draw particle
    const particleSize = 10;
    const particleCanvas = new OffscreenCanvas(particleSize, particleSize);
    const particleCtx = particleCanvas.getContext('2d');
    particleCtx.beginPath();
    particleCtx.arc(particleSize/2, particleSize/2, particleSize/2, 0, 2* Math.PI);
    particleCtx.fill();

    this.canvas = canvas;
    this.canvas.particle = particleCanvas;
    this.ctx = canvas.getContext('2d');

    this.renderObjectCount = renderObjectCount;
    this.RenderObjectClass = renderObjectClass;

    this.renderObjects = [];
  }

  /**
   * Animates all the renderingObjects by updating their new locations,
   * clearing the canvas, and drawing the renderingObjects in their new
   * locations.
   */
  animate() {
    const lastDrawTime = performance.now();
    this.fps = ~~(1000 / (lastDrawTime - this.lastDrawTime));
    this.lastDrawTime = lastDrawTime;

    requestAnimationFrame(() => this.animate());
    this.update();
    this.clear();
    this.draw();
    this.drawFps();
  }

  /**
   * Clears the canvas
   */
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /**
   * Draws each of the render objects onto the canvas.
   */
  draw() {
    this.renderObjects.forEach(renderObject => renderObject.draw());
  }

  drawFps() {
    this.ctx.fillText(this.fps, 10, 10);
  }

  /**
   * Initializes the renderObjects to render.
   */
  init() {
    let i = this.renderObjectCount;
    while (i--) this.renderObjects.push(
        new this.RenderObjectClass(this.ctx, this.width, this.height));
  }

  /**
   * Updates the canvas and height/width.
   */
  resize(height, width, devicePixelRatio) {
    this.width = width;
    this.height = height;

    if (devicePixelRatio > 1) {
      this.canvas.width = width * devicePixelRatio;
      this.canvas.height = height * devicePixelRatio;
      this.ctx.scale(devicePixelRatio, devicePixelRatio);
    } else {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }

    this.renderObjects.forEach(
        renderObject => renderObject.resizeUpdate(this.height, this.width));
  }

  /**
   * Starts the game-loop.
   */
  start() {
    this.init();
    requestAnimationFrame(() => this.animate())
  }

  /**
   * Calls the update method of each of the renderObjects.
   */
  update() {
    this.renderObjects.forEach(
        renderObject => renderObject.update());
  }
}

let canvasScene = null;

onmessage = function(evt) {
  switch (evt.data.type) {
    case 'INIT':
      const canvas = evt.data.canvas;
      canvasScene = new CanvasScene(canvas, evt.data.renderObjectCount, GlobeDot);
      break;
    case 'START':
      canvasScene.start();
      break;
    case 'RESIZE':
      const {innerHeight, innerWidth, devicePixelRatio} = evt.data;
      canvasScene.resize(innerHeight, innerWidth, devicePixelRatio);
      break;
  }
};
