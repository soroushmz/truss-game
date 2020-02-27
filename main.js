// import "linear-algebra";
// import _ from 'lodash'

// import {f1} from './file1'
// import f2 from './file1'

let id = "grid";
let canvas = document.getElementById(id);
let ctx = canvas.getContext("2d");
let canvasWidth = 480;
let canvasHeight = 270;
ctx.canvas.width = canvasWidth;
ctx.canvas.height = canvasHeight;

let xTol = 1;
//line distance tolerance
let deleteTol = 20;
//truss line color
let trussColor = "black";
//truss line width
let trussWidth = 5;
// snap to point tolerance
let snapTol = 15;
// draw joints?
let drawJoints = true;
let jointColor = "red";
let jointRadius = 5;
//support lines width
let supportLineWidth = 1;
//support hatch length
let hatchPercent = 0.2;

let data = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"> 
            <defs>
                <pattern id="smallGrid" width="8" height="8" patternUnits="userSpaceOnUse"> 
                    <path d="M 8 0 L 0 0 0 8" fill="none" stroke="gray" stroke-width="0.5" /> 
                </pattern> 
                <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"> 
                    <rect width="80" height="80" fill="url(#smallGrid)" /> 
                    <path d="M 80 0 L 0 0 0 80" fill="none" stroke="gray" stroke-width="1" /> 
                </pattern> 
            </defs> 
            <rect width="100%" height="100%" fill="url(#smallGrid)" /> 
        </svg>`;

let DOMURL = window.URL || window.webkitURL || window;
let img = new Image();
let svg = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
let url = DOMURL.createObjectURL(svg);
img.onload = function() {
  ctx.drawImage(img, 0, 0);
  // DOMURL.revokeObjectURL(url);
};
img.src = url;
let pinSupport = new component(20, 20, "black", 50, 200, "pinSupport");
let rollSupport = new component(20, 20, "black", 430, 200, "rollSupport");

function clear() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  img.onload();
  img.src = url;

  pinSupport = new component(20, 20, "black", 50, 200, "pinSupport");
  rollSupport = new component(20, 20, "black", 430, 200, "rollSupport");
}

function startGame() {
  //   f1();
  //   f2();
  // let x = _.zip(['a', 'b'], [1, 2], [true, false]);
  // console.log({x});
  makeLine();
}

function component(baseWidth, height, color, x, y, type) {
  this.baseWidth = baseWidth;
  this.height = height;
  this.x = x;
  this.y = y - height;

  if (type == "pinSupport") {
    ctx.lineWidth = supportLineWidth;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + baseWidth / 2, y);
    ctx.lineTo(x, y - height);
    ctx.lineTo(x - baseWidth / 2, y);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.moveTo(x - baseWidth, y);
    ctx.lineTo(x + baseWidth, y);
    ctx.stroke();
    let delta = height * hatchPercent;
    let NumberOfHatches = Math.floor(baseWidth / delta);
    for (let i = 0; i < NumberOfHatches; ++i) {
      ctx.moveTo(x - baseWidth + (i - 1) * delta, y + delta);
      ctx.lineTo(x - baseWidth + i * delta, y);
      ctx.stroke();
    }
    for (let i = 0; i < NumberOfHatches + 1; ++i) {
      ctx.moveTo(x + (i - 1) * delta, y + delta);
      ctx.lineTo(x + i * delta, y);
      ctx.stroke();
    }
  } else if (type == "rollSupport") {
    ctx.lineWidth = supportLineWidth;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.arc(x, y - height / 2, height / 2, 0, Math.PI * 2, true);

    ctx.fill();
    ctx.moveTo(x - baseWidth, y);
    ctx.lineTo(x + baseWidth, y);
    ctx.stroke();
    let delta = height * hatchPercent;
    let NumberOfHatches = Math.floor(baseWidth / delta);
    for (let i = 0; i < NumberOfHatches; ++i) {
      ctx.moveTo(x - baseWidth + (i - 1) * delta, y + delta);
      ctx.lineTo(x - baseWidth + i * delta, y);
      ctx.stroke();
    }
    for (let i = 0; i < NumberOfHatches + 1; ++i) {
      ctx.moveTo(x + (i - 1) * delta, y + delta);
      ctx.lineTo(x + i * delta, y);
      ctx.stroke();
    }
  }
}

function makeLine() {
  let firstX = 0;
  let firstY = 0;
  let secondX = 0;
  let secondY = 0;
  let lineList = [];
  let pointList = [];
  let pinPoint = new Point(pinSupport.x, pinSupport.y);
  let rollPoint = new Point(rollSupport.x, rollSupport.y);
  pointList.push(pinPoint, rollPoint);

  onmousedown = function(e) {
    firstX = e.clientX;
    firstY = e.clientY;
  };
  onmouseup = function(e) {
    secondX = e.clientX;
    secondY = e.clientY;
    if (secondX != firstX || secondY != firstY) {
      let pointFirst = new Point(firstX, firstY);
      let pointSecond = new Point(secondX, secondY);

      pointFirst = snapToPoint(pointFirst, pointList, snapTol);
      pointSecond = snapToPoint(pointSecond, pointList, snapTol);
      pointList.push(pointFirst, pointSecond);
      lineList.push(new Line(pointFirst, pointSecond, xTol));
      drawLine(lineList[lineList.length - 1]);
    }
  };
  ondblclick = function(e) {
    let point = new Point(e.clientX, e.clientY);
    for (let line of lineList) {
      if (isPointOnLine(point, line, deleteTol)) {
        lineList = updateGameArea(line, lineList);
        break;
      }
    }
  };
}

function snapToPoint(point, pointList, tol) {
  for (let p of pointList) {
    if (p.distanceTo(point) < tol) {
      return p;
    }
  }
  return point;
}

function Point(x, y) {
  this.x = x;
  this.y = y;
  this.distanceTo = function(P) {
    return ((x - P.x) ** 2 + (y - P.y) ** 2) ** 0.5;
  };
}

function arrayRemove(value, arr) {
  return arr.filter(function(ele) {
    return ele != value;
  });
}

function isPointOnLine(point, Line, tol) {
  if (Line.a === undefined) {
    if (Math.abs(point.x - Line.pointFirst.x) < tol) {
      return true;
    } else {
      return false;
    }
  } else {
    let intersectX =
      (point.x * (Line.pointSecond.x - Line.pointFirst.x) +
        (point.y - Line.b) * (Line.pointSecond.y - Line.pointFirst.y)) /
      (Line.pointSecond.x -
        Line.pointFirst.x +
        Line.a * (Line.pointSecond.y - Line.pointFirst.y));
    let intersectY = Line.a * intersectX + Line.b;
    let dist =
      ((point.x - intersectX) ** 2 + (point.y - intersectY) ** 2) ** 0.5;
    return dist < tol ? true : false;
  }
}

function drawLine(line) {
  ctx.lineWidth = trussWidth;
  ctx.strokeStyle = trussColor;
  ctx.beginPath();
  ctx.moveTo(line.pointFirst.x, line.pointFirst.y);
  ctx.lineTo(line.pointSecond.x, line.pointSecond.y);
  ctx.stroke();
  if (drawJoints == true) {
    ctx.fillStyle = jointColor;
    ctx.beginPath();
    ctx.arc(
      line.pointFirst.x,
      line.pointFirst.y,
      jointRadius,
      0,
      Math.PI * 2,
      true
    );
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      line.pointSecond.x,
      line.pointSecond.y,
      jointRadius,
      0,
      Math.PI * 2,
      true
    );
    ctx.fill();
  }
}

function Line(pointFirst, pointSecond, tol) {
  this.pointFirst = pointFirst;
  this.pointSecond = pointSecond;

  this.a =
    Math.abs(pointSecond.x - pointFirst.x) > tol
      ? (pointSecond.y - pointFirst.y) / (pointSecond.x - pointFirst.x)
      : undefined;
  this.b =
    Math.abs(pointSecond.x - pointFirst.x) > tol
      ? pointFirst.y - this.a * pointFirst.x
      : -pointFirst.y;
}

function updateGameArea(line, lineList) {
  lineList = arrayRemove(line, lineList);
  clear();
  for (line of lineList) {
    drawLine(line);
  }
  return lineList;
}

startGame();
