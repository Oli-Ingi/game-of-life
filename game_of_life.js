var gl;

var gameSpeed, oldTime, nowTime;

var freeze;

var lifeCell, iLifeCell, cLifeCellLiving, cLifeCellBirth, cLifeCellDeath;
var lifeCellBuffer, iLifeCellBuffer;
var cLifeCellBirthBuffer, cLifeCellDeathBuffer, cLifeCellLivingBuffer;

var sceneSize, rowCount, l;

var locPosition, locColor, locMatrix, locPerspective;

var xSpin, ySpin, oldX, oldY, rotate;
var zDist;

var gridOfLife, lifeRatio;

var totalCount, lifeCount, deathCount;

var stateAlive, stateDead;

var canvas, aspect;

window.onload = function init() {

  // Housekeeping ------------------------------

  canvas = document.getElementById( "gl-canvas" );

  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }


  gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

  gl.enable(gl.DEPTH_TEST);

  var program = initShaders( gl, "vertex-shader", "fragment-shader" );
  gl.useProgram( program );

  // My stuff

  // Initializations ------------------------------

  xSpin = 30.0;
  ySpin = 45.0;
  rowCount = 10;
  sceneSize = 1.0;
  rotate = false;
  zDist = -2.2;
  lifeRatio = 0.25;
  gameSpeed = 3000;
  freeze = true;
  totalCount = rowCount*rowCount*rowCount;
  aspect = gl.clientWidth / gl.clientHeight;

  // Vertices, index, color -----------------------

  createCell();

  iLifeCell = [
    1, 0, 3,
    3, 2, 1,
    2, 3, 7,
    7, 6, 2,
    2, 6, 5,
    5, 1, 2,
    0, 4, 7,
    7, 3, 0,
    1, 5, 4,
    4, 0, 1,
    5, 6, 7,
    7, 4, 5
  ];

  cLifeCellLiving = [
    0.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
  ];

  cLifeCellBirth = [
    0.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
  ];

  cLifeCellDeath = [
    1.0, 0.0, 0.0, 1.0,
    0.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    0.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
  ];

  // Buffers -------------------------------------

  iLifeCellBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iLifeCellBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(iLifeCell), gl.STATIC_DRAW);

  cLifeCellLivingBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cLifeCellLivingBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(cLifeCellLiving), gl.STATIC_DRAW);

  cLifeCellBirthBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cLifeCellBirthBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(cLifeCellBirth), gl.STATIC_DRAW);

  cLifeCellDeathBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cLifeCellDeathBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(cLifeCellDeath), gl.STATIC_DRAW);

  lifeCellBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lifeCellBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(lifeCell), gl.DYNAMIC_DRAW);

  // GLSL variables retrieved --------------------

  locMatrix = gl.getUniformLocation(program, "transformer");
  locPerspective = gl.getUniformLocation( program, "projection" );
  locColor = gl.getAttribLocation(program, "vColor");
  locPosition = gl.getAttribLocation(program, "vPosition");
  gl.enableVertexAttribArray(locPosition);
  gl.enableVertexAttribArray(locColor);

  // Initialize perspective -------------------

  proj = perspective( 50.0, aspect, 0.01, 100.0 );
  gl.uniformMatrix4fv(locPerspective, false, flatten(proj));

  // HTML elements -------------------------

  var stateScreen = document.querySelector(".progress-group");
  var stopBtn = document.getElementById("freeze-btn");
  var resetBtn = document.getElementById("reset-btn");
  var rowSlider = document.getElementById("rowCount");
  var rowDisplay = document.getElementById("cells-row");
  var lifeSlider = document.getElementById("lifeOdds");
  var lifeDisplay = document.getElementById("cells-life");
  var stateTotal = document.getElementById("total-cells");

  stateAlive = document.getElementById("alive-cells");
  stateDead = document.getElementById("dead-cells");

  // Event listeners -----------------------------

  canvas.addEventListener("mousedown", function(e) {
    rotate = true;
      oldX = e.offsetX;
      oldY = e.offsetY;
      e.preventDefault();
  });

  canvas.addEventListener("mousemove", function(e) {
    if (rotate) {
      xSpin = (xSpin + (e.offsetY - oldY)) % 360;
      ySpin = (ySpin + (e.offsetX - oldX)) % 360;
      oldX = e.offsetX;
      oldY = e.offsetY;
    }
  });

  window.addEventListener("keydown", function(e) {
    switch (e.keyCode) {
      case 38:
        if ( zDist < -0.75) zDist += 0.1;
        break;
      case 40:
        if (zDist > -8.0) zDist -= 0.1;
    };
  });

  window.addEventListener("mouseup", function() {
    rotate = false;

    resetBtn.style.border = "3px outset rgba(255,255,255,0.8)"
    resetBtn.style.backgroundColor = "rgba(0,0,200, 0.5)";
  });

  window.addEventListener("mousewheel", function(e) {
    if (e.wheelDelta > 0 && zDist < -0.75) zDist += 0.25;
    else if (e.wheelDelta < 0 && zDist > -8.0) zDist -= 0.25;
  });


  resetBtn.addEventListener("mousedown", function() {
    resetBtn.style.border = "3px inset rgba(255,255,255,0.8)"
    resetBtn.style.backgroundColor = "rgba(0,0,75, 0.5)";
  });


  stopBtn.addEventListener("click", function() {
    freeze = !freeze;

    totalCount = rowCount*rowCount*rowCount;
    stateTotal.innerText = totalCount;

    if (!freeze) {
      this.style.border = "3px inset rgba(255,255,255,0.8)";
      this.style.backgroundColor = "rgba(0,0,75, 0.5)";
      this.innerText = "Pause";
      stateScreen.style.display = "block";
    } else {
      this.style.border = "3px outset rgba(255,255,255,0.8)";
      this.style.backgroundColor = "rgba(0,0,200, 0.5)";
      this.innerText = "Resume";
    }
  });


  resetBtn.addEventListener("click", function() {
    freeze = true;
    rowCount = rowSlider.value;
    lifeRatio = lifeSlider.value / 100;
    totalCount = rowCount*rowCount*rowCount;
    stopBtn.style.border = "3px outset rgba(255,255,255,0.8)";
    stopBtn.style.backgroundColor = "rgba(0,0,200, 0.5)";
    stopBtn.innerText = "Start";
    stateScreen.style.display = "none";


    createCell();
    gl.bindBuffer(gl.ARRAY_BUFFER, lifeCellBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(lifeCell));

    createGrid();
  });


  rowSlider.addEventListener("input", function() {
    rowDisplay.innerText = this.value;
  });

  lifeSlider.addEventListener("input", function() {
    lifeDisplay.innerText = this.value;
  });

  // Game stuff ---------------------

  createGrid();

  oldTime = new Date();
  nowTime = new Date();


  render();
}

function createCell() {
  l = sceneSize / rowCount; // cell Length, width and height
  var x, y, z;
  x = y = z = -(l / 2); // point of reference at lowest x, y, z values
  var w = 1.0;

  lifeCell = [
    x,   y,   z+l, w,
    x,   y+l, z+l, w,
    x+l, y+l, z+l, w,
    x+l, y,   z+l, w,
    x,   y,   z,   w,
    x,   y+l, z,   w,
    x+l, y+l, z,   w,
    x+l, y,   z,   w
  ];

}

function createGrid() {
  gridOfLife = [];
  lifeCount = 0;

  for (var i = 0; i < rowCount; i++) {
    gridOfLife.push([]);
    for (var j = 0; j < rowCount; j++) {
      gridOfLife[i].push([]);
      for (var k = 0; k < rowCount; k++) {
        var lifeOdds = Math.random() < lifeRatio;
        var AllNeighbours;

        var cell = {
          isAlive: lifeOdds,
          neighbours: [],
          size: 1.0,
          resurrection: false,
          sentencedToDeath: false
        };
        if (!cell.isAlive) cell.size = 0.0;
        else lifeCount += 1;

        AllNeighbours = [
            vec3(i+1, j+1, k+1),
            vec3(i+1, j+1, k),
            vec3(i+1, j+1, k-1),
            vec3(i+1, j,   k+1),
            vec3(i+1, j,   k),
            vec3(i+1, j,   k-1),
            vec3(i+1, j-1, k+1),
            vec3(i+1, j-1, k),
            vec3(i+1, j-1, k-1),
            vec3(i,   j+1, k),
            vec3(i,   j+1, k+1),
            vec3(i,   j+1, k-1),
            vec3(i,   j,   k+1),
            vec3(i,   j,   k-1),
            vec3(i,   j-1, k+1),
            vec3(i,   j-1, k),
            vec3(i,   j-1, k-1),
            vec3(i-1, j+1, k+1),
            vec3(i-1, j+1, k),
            vec3(i-1, j+1, k-1),
            vec3(i-1, j,   k+1),
            vec3(i-1, j,   k),
            vec3(i-1, j,   k-1),
            vec3(i-1, j-1, k+1),
            vec3(i-1, j-1, k),
            vec3(i-1, j-1, k-1)
          ];

          for (var s = 0; s < AllNeighbours.length; s++) {
            if(AllNeighbours[s][0] > -1 && AllNeighbours[s][1] > -1
            && AllNeighbours[s][2] > -1 && AllNeighbours[s][0] < rowCount
            && AllNeighbours[s][1] < rowCount && AllNeighbours[s][2] < rowCount) {
              cell.neighbours.push(AllNeighbours[s]);
            }
          }
          gridOfLife[i][j][k] = cell;
      }
    }
  }

  stateDead.innerText = totalCount - lifeCount;
  stateAlive.innerText = lifeCount;
  lifeCount = 0;
}

function drawCell(cell) {
  if (cell.isAlive && cell.size < 1.0)
    gl.bindBuffer(gl.ARRAY_BUFFER, cLifeCellBirthBuffer);
  else if (!cell.isAlive)
    gl.bindBuffer(gl.ARRAY_BUFFER, cLifeCellDeathBuffer);
  else
    gl.bindBuffer(gl.ARRAY_BUFFER, cLifeCellLivingBuffer);

  gl.vertexAttribPointer(locColor, 4, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, lifeCellBuffer);
  gl.vertexAttribPointer(locPosition, 4, gl.FLOAT, false, 0, 0);
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);
}

function tickGame() {

  for (var i = 0; i < rowCount; i++) {
    for (var j = 0; j < rowCount; j++) {
      for (var k = 0; k < rowCount; k++) {

        var cell = gridOfLife[i][j][k];

        var count = 0;
        for (var r = 0; r < cell.neighbours.length; r++) {
          var nAddress = cell.neighbours[r];
          var neighbour = gridOfLife[nAddress[0]][nAddress[1]][nAddress[2]];
          if (neighbour.isAlive) count += 1;
        }
        if (!cell.isAlive && count == 6) cell.resurrection = true;
        else if (cell.isAlive && !(count == 5 || count == 6 || count == 7)) {
          cell.sentencedToDeath = true;
        }
      }
    }
  }
}

function resize(canvas) {
  var displayWidth  = canvas.clientWidth;
  var displayHeight = canvas.clientHeight;
  aspect = displayWidth / displayHeight;

  if (canvas.width  != displayWidth ||
      canvas.height != displayHeight) {

    canvas.width  = displayWidth;
    canvas.height = displayHeight;

    proj = perspective( 50.0, aspect, 0.01, 100.0 );
    gl.uniformMatrix4fv(locPerspective, false, flatten(proj));
  }
}

function render() {


  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  resize(canvas);
  gl.viewport( 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight );

  if (!freeze && !rotate) ySpin -= 0.1;

  // My stuff

  ctm = lookAt(vec3(0.0, 0.0, zDist),
               vec3(0.0, 0.0, 0.0),
               vec3(0.0, 1.0, 0.0));
  var ctm = mult(ctm, rotateX(xSpin));
  var ctm = mult(ctm, rotateY(ySpin));
  var ctmCell;

  // left- down- innermost vertice of first cell moved to
  // left- down- innermost corner of Scene
  var startPoint = l / 2 - (sceneSize / 2);
  // space between start of a cell to start of another.
  var seperation = sceneSize / rowCount;
  for (var i = 0; i < rowCount; i++) {
    var x = startPoint + i*seperation;
    for (var j = 0; j < rowCount; j++) {
      var y = startPoint + j*seperation;
      for (var k = 0; k < rowCount; k++) {
        var cell = gridOfLife[i][j][k];

        if (cell.isAlive || cell.size > 0.0) {
          if (cell.isAlive && cell.size < 1.0 && !freeze) cell.size += 0.02;
          else if (!cell.isAlive && !freeze) cell.size -= 0.02;
          var z = startPoint + k*seperation;

          ctmCell = mult(ctm, translate(x, y, z));
          ctmCell = mult(ctmCell, scalem(cell.size, cell.size, cell.size));
          gl.uniformMatrix4fv(locMatrix, false, flatten(ctmCell));
          drawCell(cell);

        } else cell.size = 0.0;

        if (cell.sentencedToDeath) {
          cell.isAlive = false;
          cell.sentencedToDeath = false;
          cell.resurrection = false;
        }
        else if (cell.resurrection) {
          cell.isAlive = true;
          cell.resurrection = false;
          cell.sentencedToDeath = false;
        }

        if (cell.isAlive) lifeCount += 1;

      }
    }
  }

  stateDead.innerText = totalCount - lifeCount;
  stateAlive.innerText = lifeCount;
  lifeCount = 0;

  nowTime = new Date();

  if (nowTime - oldTime >= gameSpeed) {
    if (!freeze) tickGame();
    oldTime = nowTime;
  }

  window.requestAnimFrame(render);
}
