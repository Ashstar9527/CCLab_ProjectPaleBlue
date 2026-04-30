/*
This is the formal version of Project B. Overheating ISSUE
*/

let systems = []; // hold solar systems
let ashes = [];

// Mouse image
let imgPlay;
let imgStop;
let imgRipple;
let imgVinyl;

// Sound effects
let bgSound; // Add space exploration bgm.
let soundStarted = false;
let jumpSound; // Space jump
let sunPieces = [];
let playingSunPiece = false;
let scannerSound = [];
let playingScanner = false;
let starSound;
let playingStarSound = false;
let starClick;
let playingStarClick = false;

// Space jump animation set up
let jumpPhase = "idle";
let jumpFrame = 0;
let jumpOrder = ["wind", "twist", "unwind", "settle", "idle"];
let jumpLen = {
  wind: 30, twist: 24, unwind: 32, settle: 22
} // dictionary, adjusted for the sound effect

let sp = 1; //multiplier into arc rotation
let twist = 0; //0 - no warp, 1 - full
let fade = 0; //transition btw two systems
let next = 0; // the next to play
let current = 0; // the current displayed system

let spinAcc = 0; //replace frameCount as acceleration

function preload() {
  bgSound = loadSound("assets/bgSound.mp3");
  jumpSound = loadSound("assets/jumpSound.mp3");
  for (let i = 1; i <= 5; i++) {
    let name = 'assets/sunPieces/sunPiece' + i + '.mp3';
    sunPieces.push(loadSound(name));  
  }
  scannerSound = [
    loadSound("assets/scanner1.mp3"),
    loadSound("assets/scanner2.mp3")
  ]
  starSound = loadSound("assets/stars.mp3");
  starClick = loadSound("assets/starsClicked.mp3");

  // Load images for mouse
  imgPlay = loadImage("assets/play.png");
  imgStop = loadImage("assets/stop.png");
  imgRipple = loadImage("assets/ripple.gif");
  imgVinyl = loadImage("assets/vinyl.gif");
}

function setup() {
  createCanvas(windowWidth, windowHeight); 
  for (let i = 0; i < 5; i++) {
    systems.push(new SolarSystem()); // create 5 systems in advance.
  }

  for (let i = 0; i < 200; i++) {
    ashes.push(new Ash(random(1)));
  }
  bgSound.setVolume(0.5);
  jumpSound.setVolume(0.6);
  starSound.setVolume(2);
  starClick.setVolume(2);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight)
}

function draw() {
  updateJump();
  spinAcc += sp;
  background(systems[current].theme.bg);

  if (fade < 0.999) systems[current].update(1-fade);
  if (fade > 0.001) systems[next].update(fade);
  drawGrid();

  push();
  translate(width/2, height/2);
  for (let a of ashes) {
    a.update();
    a.display();
  }
  pop();
  drawScan();
}

let scanX = 0;
let scanY = 0;

function drawScan() {
  let breath;
  scanX = lerp(scanX, mouseX, 0.2);
  scanY = lerp(scanY, mouseY, 0.2);
  colorMode(RGB, 255);
  noFill();
  let c = systems[current].theme.c3;
  let d = dist(mouseX, mouseY, width/2, height/2);
  let icon;
 
  push();
  tint(systems[current].theme.c2);
  if (playingSunPiece) {
    icon = imgStop;
  } else {
    icon = imgPlay;
  }
  pop();

  if (d < height * 0.2) {
    breath = sin(frameCount / 10) * 4;
  } else if (d < height * 0.45) {
    c = "#b5f9f4";
    breath = sin(frameCount / 30) * 2;
  } else {
    c = systems[current].theme.c4;
    breath = sin(frameCount / 40) * 2;
  }
  let sz = 50 + breath;
  stroke(c);
  if (mouseIsPressed) {
    strokeWeight(3 + 3 * twist);
    sz = 50 + breath;
  } else {
    strokeWeight(2 + 3 * twist);
  }

  icon.resize(40, 40);
  imgRipple.resize(80, 80);
  imgVinyl.resize(90, 90);
  imageMode(CENTER);

  if (d < height * 0.45) {
    if (d < height * 0.2) {
      rect(scanX - sz/2, scanY - sz/2, sz, sz);
      image(icon, scanX, scanY);
    } else {
      circle(scanX, scanY, sz/3)
      image(imgVinyl, scanX, scanY);
    }
  } else {
    image(imgRipple, scanX, scanY);
  }
}

let sysScale = 1; // zoom in/out effect

function updateJump() {
  if (jumpPhase == "idle") {
    sysScale = lerp(sysScale, 1, 0.2);
    sp = lerp(sp, 1, 0.15);
    fade = 0;
    twist = 0;
    if (current != next) {current = next};
    return;
  }

  let d = jumpLen[jumpPhase]; //time one 'phase' would last
  let t = constrain(jumpFrame / d, 0, 1); //progress parameter, from drawBlink();

  if (jumpPhase == "wind") {
    let e = t * t * t;
    sysScale = 1 + 0.08 * e;
    sp = lerp(1, 9, e);
    fade = 0;
    twist = 0;

  } else if (jumpPhase == "twist") {
    let e; // a function a++ till middle and a-- later
    if (t < 0.5) {
      e = 4 * t * t * t;
    } else {
      e = 1 - pow(-2*t+2, 3) / 2;
    }
    sysScale = lerp(1.12 , 0.78, e);
    sp = lerp(9, 14, e);
    fade = e * e;
    twist = sin(PI * t);

  } else if (jumpPhase == "unwind") {
    let e = 1 - pow(1-t, 3);
    sysScale = lerp(0.78, 1.06, e);
    sp = lerp(14, 3, e);
    fade = 1;
    twist = lerp(1, 0, e);

  } else if (jumpPhase == "settle") {
    let e = 1 - pow(1-t, 3);
    sysScale = lerp(1.06, 1, e);
    sp = lerp(3, 1, e);
    twist = 0;
    fade = 1;
  }

  jumpFrame++;
  if (jumpFrame >= d) {
    jumpFrame = 0;
    jumpPhase = jumpOrder[jumpOrder.indexOf(jumpPhase) + 1];
    if (jumpPhase == "unwind") {current = next};
  }
}  

class Planet {
  constructor(theme, R) {
    this.theme = theme;
    this.r = random(R * 0.5, R * 1.5);
    this.ang = random(TWO_PI);
    this.speed = random(0.002, 0.008);
    //vari direction
    if (random(1) < 0.5) {
      this.speed *= -1;
    } 
    this.tilt = random(0.3, 1);
    this.size = random(10, 50)
    this.colGradient = random(0.25, 0.75)

    this.depth = random(0, 0.3);
    this.texture = random(0.3, 0.7);
  }

  update() {
    this.ang += this.speed * sp;
  };

  display(al, R) {
    //Get coordinates
    let x = cos(this.ang) * this.r;
    let y = sin(this.ang) * this.r * this.tilt;
    //Extract theme colors
    let c1 = this.theme.c1;
    let c2 = this.theme.c2;
    let c3 = this.theme.c3;
    let c4 = this.theme.c4;

    // Selecting color over the theme
    let col;
    if (this.colGradient < 0.33) {
      col = lerpColor(c1, c2, this.colGradient * 3);
    } else if (this.colGradient < 0.67) {
      col = lerpColor(c2, c3, (this.colGradient - 0.33)* 3);
    } else {
      col = lerpColor(c3, c4, (this.colGradient - 0.67) * 3);
    }

    // Adding shades and bright side
    let shadow = lerpColor(col, c1, 0.75);
    let lit = lerpColor(col, c4, 0.4)
    let numSlices = 80;
    let lightAng = atan2(y, x);

    //Size on the ellipse orbit scale
    let depthScale = map(this.r, R * 0.5, R * 1.5, 1.1, 0.8);
    let shift = this.size * depthScale * 0.3;
     
    push();
    translate(x, y);
    rotate(lightAng);

    noStroke();
    for (let i = 0; i < numSlices; i++) {
      let j = i / (numSlices-1);
      push();
      translate(shift * j * 0.5, 0); // shift each slice outward;
      let c = lerpColor(lit, shadow, pow(j, this.texture) - this.depth);
      c.setAlpha(al * 25) //al adjust for transition
      fill(c);
      circle(0, 0, this.size * depthScale - j * shift);
      pop();
    }
    pop();
  }
}

function makeTheme() {
  colorMode(HSL, 360, 100, 100);  
  let h1 = random(360);
  //Randonize direction
  let dir;
  if (random(1) < 0.5) {dir = 1;} else {dir = -1};
  let h2 = (h1 + dir * random(60, 80) + 360) % 360;
  let h3 = (h2 + dir * random(80, 140) + 360) % 360;
  let h4 = (h3 + random(-3, 3) + 360) % 360;

  let theme = {
    c1: color(h1, 60 + random(-8, 8), 12+random(-3,4)),
    c2: color(h2, 70 + random(-8, 10), 40 + random(-4, 6)),
    c3: color(h3, 85 + random(-8,6), 74+random(-5,5)),
    c4: color(h4, 80 + random(-8,8), 96+random(-2, 2)),
    bg: color(h1, 35, 5)
  }; // Use the properties of an 'object' to store the values.

  colorMode(RGB, 255);  
  return theme;
}

class SolarSystem {
  constructor() {
    this.theme = makeTheme(); //create color palette
    this.storeArc();
    this.planets = [];
    for (let i = 0; i < floor(random(3, 6)); i++) {
      this.planets.push(new Planet(this.theme, height/4))
    }
  }

  storeArc() {
    this.points = [];
    let c1 = this.theme.c1;
    let c2 = this.theme.c2;
    let c3 = this.theme.c3;
    let c4 = this.theme.c4;

    this.bgCircles = []; //Build circles radial glow
    for (let i = 0; i < 150; i++) {
      let t = i / 149;
      let c;
      if (t < 0.33) {
        c = lerpColor(c1, c2, t * 3);
      } else if (t < 0.67) {
        c = lerpColor(c2, c3, (t - 0.33) * 3);
      } else {
        c = lerpColor(c3, c4, (t - 0.67) * 3);
      }
      c.setAlpha(5 * t + 20);
      this.bgCircles.push(c);
    }

    // Arcs in the mid ground
    this.midArcs = [];
    for (let i = 0; i < 60; i++) {
      let t = i / 59; //Set gradient ratio
      let c;
      if (t < 0.33) {
        c = lerpColor(c1, c2, constrain(t * 3 + random(-0.15, 0.15), 0, 1)); // Adding constrain to ensure bounded between 0, 1
      } else if (t < 0.67) {
        c = lerpColor(
          c2,
          c3,
          constrain((t - 0.33) * 3 + random(-0.15, 0.15), 0, 1)
        );
      } else {
        c = lerpColor(
          c3,
          c4,
          constrain((t - 0.67) * 3 + random(-0.15, 0.15), 0, 1)
        );
      }
      c.setAlpha(5 * t + 70);

      let numSegs = floor(random(5, 9)); //Break into segments
      let arcs = [];
      for (let j = 0; j < numSegs; j++) {
        let span = TWO_PI / numSegs;
        let d;
        if (random() < 0.5) {
          d = 1;
        } else {
          d = -1;
        }
        arcs.push({
          // I'm using simplified formatting here
          start: j * span + random(0, span * 0.5),
          end: j * span + random(span * 0.5, span),
          dir: d, //direction it spans
        });
      }
      this.midArcs.push({ color: c, arcs: arcs }); //record color and arcs segments

      // Add points
      c.setAlpha(155 + 0 * random(-1, 1));
      let numPts = floor(random(8, 16));
      let dots = [];
      let k = 0;
      for (let j = 0; j < numPts; j++) {
        let span = TWO_PI / numPts;
        dots.push({
          ang: random(k, k + span),
          dir: random(-1, 1)
        })
        k += span;
      }
      this.points.push({color: c, dots: dots});
    }

    // Front arcs
    this.frontArcs = [];
    for (let i = 0; i < 100; i++) {
      let t = i / 99; //Set gradient ratio
      let c;
      if (t < 0.33) {
        c = lerpColor(c1, c2, constrain(t * 3 + random(-0.15, 0.15), 0, 1)); // Adding constrain to ensure bounded between 0, 1
      } else if (t < 0.67) {
        c = lerpColor(
          c2,
          c3,
          constrain((t - 0.33) * 3 + random(-0.15, 0.15), 0, 1)
        );
      } else {
        c = lerpColor(
          c3,
          c4,
          constrain((t - 0.67) * 3 + random(-0.15, 0.15), 0, 1)
        );
      }
      c.setAlpha(100 * t + 155);

      let numSegs = floor(random(3, 6)); //Break into segments
      let arcs = [];
      for (let j = 0; j < numSegs; j++) {
        if (i % 4 < 1) {
          continue; // Create skips manually
        }
        let span = TWO_PI / numSegs;
        let d;
        if (random() < 0.5) {
          d = 1;
        } else {
          d = -1;
        }
        arcs.push({
          // I'm using simplified formatting here
          start: j * span + random(0, span * 0.5),
          end: j * span + random(span * 0.5, span),
          dir: d, //direction it spans
        });
      }
      this.frontArcs.push({ color: c, arcs: arcs }); //record color and arcs segments
    }
  }

  drawArcs(R, al) {
    //Circles first, from large to small
    noStroke();
    for (let i = 0; i < this.bgCircles.length; i++) {
      let c = this.bgCircles[i]; // translate back to add a;
      fill(red(c), green(c), blue(c), alpha(c) * al);
      circle(0, 0, R * 2 * (1 - i / (this.bgCircles.length + 1)));
    }

    // mid arcs
    noFill();
    strokeWeight(R / (this.midArcs.length + 2 ));
    for (let i = 0; i < this.midArcs.length; i++) {
      let layer = this.midArcs[i];
      let r = R * (1 - i / (this.midArcs.length + 1));
      let spin = (spinAcc / 800) * (1.5 + (1 - i / this.midArcs.length));

      //Each seg
      for (let j = 0; j < layer.arcs.length; j++) {
        let a = layer.arcs[j];
        let c = layer.color; // translate back to add a;
        stroke(red(c), green(c), blue(c), alpha(c) * al);
        arc(0, 0, r * 2, r * 2, a.start + spin * a.dir, a.end + spin * a.dir);
      }
    }

    // Front arcs
    strokeWeight((R / (this.frontArcs.length + 1)) * 0.8); //thinner
    for (let i = 0; i < this.frontArcs.length; i++) {
      let layer = this.frontArcs[i];
      let r = R * (1 - i / (this.frontArcs.length + 1));
      let spin =
        (spinAcc / 200) * (1.5 + (1 - i / this.frontArcs.length) / 2);
      

      //Each seg
      for (let j = 0; j < layer.arcs.length; j++) {
        let a = layer.arcs[j];
        let c = layer.color; // translate back to add a;
        stroke(red(c), green(c), blue(c), alpha(c) * al);
        arc(0, 0, r * 2, r * 2, a.start + spin * a.dir, a.end + spin * a.dir);
      }
    }

    // Draw points
    noStroke();
    for (let i = 0; i < this.points.length; i++) {
      let layer = this.points[i];
      let r = R * (1 - i / (this.points.length + 1));
      let spin = (spinAcc / 200) * (1.5 + (1 - i / this.points.length) / 2);
      let c = layer.color; // translate back to add a;
        fill(red(c), green(c), blue(c), alpha(c) * al * 1.2);
      for (let d of layer.dots) {
        let a = d.ang + spin * d.dir;
        circle(r * cos(a), r * sin(a), 3);
      }
    }
  }

  update(al) {
    if (al == undefined) {al = 1};
    let R = height * 0.45;
    push();
    translate(width / 2, height / 2);
    scale(sysScale, -sysScale); //Zooms during jump

    this.drawArcs(R, al);

    for (let p of this.planets) {
      p.update();
      p.display(al, R);
    }
    pop();
  }
}

function keyPressed() {
  // Switch 'windows'
  if (key == " " && jumpPhase == "idle") {
    jumpPhase = "wind";
    jumpFrame = 0;
    next = (current + 1) % systems.length;
    jumpSound.play();
    if (playingSunPiece) {
      fadingOut(sunPieces[current]);
    }
    playingSunPiece = false;
    if (playingStarSound) {
      fadingOut(starSound);
    }
    playingStarSound = false;
  }

  // Start bgm on first interaction
  if (!soundStarted) {
    bgSound.loop();
    soundStarted = true;
  }
}

function mousePressed() {
  // Play sun piece with clicking.
  let d = dist(mouseX, mouseY, width/2, height/2);
  if (d < height * 0.2) {
    if (playingSunPiece) {
      fadingOut(sunPieces[current]);
      playingSunPiece = false;
    } else {
      sunPieces[current].loop();
      playingSunPiece = true;
    } 
  }
  starClick.rate(random(0.5, 2));
  starSound.rate(random(1, 2));

  if (d > height * 0.45) {
    if (!playingStarSound) {
      starSound.setVolume(2);
      starSound.loop();
      playingStarSound = true;
    } 

    if (!starClick.isPlaying()) {
      starClick.play();
    }
  } else {
    scannerSound[0].play();
  }
  
}

function mouseReleased() {
  let d = dist(mouseX, mouseY, width/2, height/2);

  if (d < height * 0.45) {scannerSound[1].play();}
  if (playingStarSound) {
    fadingOut(starSound);
    playingStarSound = false;
  }
}

// Fading out effects. By this point my laptop is hot enough to fry an egg.
function fadingOut(piece) {
  piece.setVolume(0, 1);
  setTimeout(() => {
    piece.stop();
    piece.setVolume(1);
  }, 1000);
}

// Star field
let s = 30;

function drawGrid() {   
  push();
  translate(width / 2, height / 2);
  rotate(radians(spinAcc / 20 ));
  
  translate(-width / 2, -height / 2)

  let starColor = systems[current].theme.c4;
      fill(starColor);
  
  for (let x = -250; x < width + 250; x += s) {
    for (let y = -250; y < height + 250; y += s) {
      let flicker = noise(x / 200, y / 200, sin(frameCount / 40));
      let r = map(flicker, 0, 1, 0, 3);

      let jx = noise(x * 0.3, y * 0.3) * s * 3;
      let jy = noise(x * 0.3 + 200, y * 0.3 + 200) * s * 3;
      let cx = x + jx;
      let cy = y + jy;
       // adding radiant transparency
      let d = dist(cx, cy, width/2, height/2);
      let edgeFade = map(d, 0, min(width, height) * 0.5, 0, 1);
      let sc = color(starColor);
      sc.setAlpha(edgeFade);
      fill(sc);
      noStroke()
      if (d>= 100) {
      circle(cx, cy, r);
    }
    }
  }
  
  colorMode(RGB, 255, 255, 255, 100);  
  pop();
}

// Ashes in the Universe
class Ash {
  constructor(init) {
    this.r = map(init, 0, 1, 40, width); //random starting to the center
    this.ang = random(TWO_PI); //random starting angle
    this.size = random(1, 3.5);
    this.speed = random(0.5, 1.25);
    this.phase = random(TWO_PI); // offset to avoid flickering together
  }

  display() {
    let opa = map(this.r, 0, width, 20, 80);
    let flicker = 1 + 0.3 * sin(frameCount * 0.05 + this.phase);
    noStroke();
    fill(255, 255, 255, opa * flicker);

    // Draw small triangles
    push();
    translate(-cos(this.ang) * this.r, sin(this.ang) * this.r);

    rotate(this.ang); //outward
    let sz = this.size;
    triangle(0, -sz, -sz * 0.3, sz, sz * 0.9, sz);
    pop();
  }

  update() {
    this.r += 0.2 * this.speed * sp;
    this.ang += this.speed * 0.001 * sp;
    
    if (this.r > width) {
      this.r = random(0, 180);
      this.ang = random(TWO_PI);
    }
  }
}