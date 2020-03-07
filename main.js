const math = require("mathjs");
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
//point number
let pointNumber = 0;
// element area in m^2 so element stress is in kN/m^2
let Area = 1e-4;
// element modulus in kN/m^2
let E = 200e6;
// stiffness matrix initialization
let stiffMatrix;
// force matrix initilization
let forceMatrix;
// weight force in kN
let weightForce = 4e3;
// element yield stress
let Fy = 350;
// length multiplier, length in m
let lenScale = 1e-2;
//stree multiplier to make it in MPa
let stressScale = 1e-3;

//support and weight info
let pinSupportX = 50;
let pinSupportY = 200;
let rollSupportX = 430;
let rollSupportY = 200;
let supportWidth = 20;
let supportHeight = 20;
let weightSupportX = 240;
let weightSupportY = 200;
let weightWidth = 20;
let weightHeight = 20;
let weightColor = "blue";

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

let pinSupport = new component(
  supportWidth,
  supportHeight,
  "black",
  pinSupportX,
  pinSupportY,
  "pinSupport"
);
let rollSupport = new component(
  supportWidth,
  supportHeight,
  "black",
  rollSupportX,
  rollSupportY,
  "rollSupport"
);
let weight = new component(
  weightWidth,
  weightHeight,
  weightColor,
  weightSupportX,
  weightSupportY,
  "weight"
);

let lineList = [];
let pointList = [];
let pinPoint = new Point(pinSupport.x, pinSupport.y, 0);
pointNumber += 1;
let rollPoint = new Point(rollSupport.x, rollSupport.y, 1);
pointNumber += 1;
let weightPoint = new Point(weight.x, weight.y, 2);
pointNumber += 1;

pointList.push(pinPoint, rollPoint, weightPoint);

let xyConstraintList = [0]; // list of points with xy constraint
let xConstraintList = []; // list of points with x constraint
let yConstraintList = [1]; // list of points with y constraint

let rowsTemp; //which degrees of freedom are active
let solution;
let lineStress = [];

let checkDiv = document.getElementById("checkTrussButton");
const checkButton = document.createElement("button");
checkButton.innerHTML = "Check!";
checkDiv.append(checkButton);
checkButton.addEventListener("click", checkTruss);

let clearDiv = document.getElementById("clearBoard");
const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear!";
clearDiv.append(clearButton);
clearButton.addEventListener("click", clear);

let stiffDiv = document.getElementById("globalStiffness");
const stiffButton = document.createElement("button");
stiffButton.innerHTML = "Global Stiffness!";
stiffDiv.append(stiffButton);
stiffButton.addEventListener("click", globalStiffness);

let boundDiv = document.getElementById("applyBoundary");
const boundButton = document.createElement("button");
boundButton.innerHTML = "Apply Boundary!";
boundDiv.append(boundButton);
boundButton.addEventListener("click", applyBoundary);

let anaDiv = document.getElementById("Analyze");
const anaButton = document.createElement("button");
anaButton.innerHTML = "Analyze!";
anaDiv.append(anaButton);
anaButton.addEventListener("click", Analyze);

let stressDiv = document.getElementById("stressResult");
const stressButton = document.createElement("button");
stressButton.innerHTML = "Stress Results!";
stressDiv.append(stressButton);
stressButton.addEventListener("click", stressResults);

let drawDiv = document.getElementById("drawResult");
const drawButton = document.createElement("button");
drawButton.innerHTML = "Draw Results!";
drawDiv.append(drawButton);
drawButton.addEventListener("click", drawResults);

function clear(){
  clearScreen();
  drawSupports();
  emptyVars();
}

function clearScreen(){
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  img.onload();
  img.src = url;
}

function drawSupports(){
  pinSupport = new component(
    supportWidth,
    supportHeight,
    "black",
    pinSupportX,
    pinSupportY,
    "pinSupport"
  );
  rollSupport = new component(
    supportWidth,
    supportHeight,
    "black",
    rollSupportX,
    rollSupportY,
    "rollSupport"
  );
  weight = new component(
    weightWidth,
    weightHeight,
    weightColor,
    weightSupportX,
    weightSupportY,
    "weight"
  );
}

function emptyVars(){
  lineList = [];
  pointList = [];
  pointList.push(pinPoint, rollPoint, weightPoint);
  solution = [];
  lineStress = [];
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
  } else if (type == "weight") {
    ctx.lineWidth = supportLineWidth;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.fillRect(x - baseWidth / 2, y, baseWidth, height);
    ctx.fill();
    ctx.moveTo(x, y);
    ctx.lineTo(x + baseWidth / 2, y);
    ctx.lineTo(x, y - height);
    ctx.lineTo(x - baseWidth / 2, y);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function makeLine() {
  let firstX = 0;
  let firstY = 0;
  let secondX = 0;
  let secondY = 0;

  onmousedown = function(e) {
    firstX = e.clientX;
    firstY = e.clientY;
  };
  onmouseup = function(e) {
    secondX = e.clientX;
    secondY = e.clientY;
    if (
      (secondX != firstX || secondY != firstY) &&
      checkBoundaryX(firstX) &&
      checkBoundaryX(secondX) &&
      checkBoundaryY(firstY) &&
      checkBoundaryY(secondY)
    ) {
      let pointFirst = new Point(firstX, firstY, pointNumber);
      pointNumber += 1;
      let pointSecond = new Point(secondX, secondY, pointNumber);
      pointNumber += 1;

      pointFirst = snapToPoint(pointFirst, pointList, snapTol);
      pointSecond = snapToPoint(pointSecond, pointList, snapTol);
      pointList = addUniquePoint(pointFirst, pointList);
      pointList = addUniquePoint(pointSecond, pointList);
      lineList.push(new Line(pointFirst, pointSecond, xTol));
      drawLine(lineList[lineList.length - 1]);
    }
  };
  ondblclick = function(e) {
    let point = new Point(e.clientX, e.clientY);
    for (let line of lineList) {
      if (isPointOnLine(point, line, deleteTol)) {
        [lineList, pointList] = updateGameArea(line, lineList, pointList);
        break;
      }
    }
  };
}

function globalStiffness() {
  let numberPoints = pointList.length;

  stiffMatrix = math.zeros(numberPoints * 2, numberPoints * 2);
  let count = 0; // counter for points
  let countBreak = 0; // counter for two line endpoints
  let countPointFirst = -1;
  let countPointSecond = -1;

  for (let line of lineList) {
    for (let point of pointList) {
      if (point.number === line.pointFirst.number) {
        stiffMatrix._data[count][count] += line.c2 / line.len;
        stiffMatrix._data[count][count + 1] += line.cs / line.len;
        stiffMatrix._data[count + 1][count] += line.cs / line.len;
        stiffMatrix._data[count + 1][count + 1] += line.s2 / line.len;
        countPointFirst = count;
        countBreak += 1;
      }

      if (point.number === line.pointSecond.number) {
        stiffMatrix._data[count][count] += line.c2 / line.len;
        stiffMatrix._data[count][count + 1] += line.cs / line.len;
        stiffMatrix._data[count + 1][count] += line.cs / line.len;
        stiffMatrix._data[count + 1][count + 1] += line.s2 / line.len;
        countPointSecond = count;
        countBreak += 1;
      }

      if (countPointFirst !== -1 && countPointSecond !== -1) {
        stiffMatrix._data[countPointFirst][countPointSecond] +=
          -line.c2 / line.len;
        stiffMatrix._data[countPointFirst][countPointSecond + 1] +=
          -line.cs / line.len;
        stiffMatrix._data[countPointFirst + 1][countPointSecond] +=
          -line.cs / line.len;
        stiffMatrix._data[countPointFirst + 1][countPointSecond + 1] +=
          -line.s2 / line.len;

        stiffMatrix._data[countPointSecond][countPointFirst] +=
          -line.c2 / line.len;
        stiffMatrix._data[countPointSecond + 1][countPointFirst] +=
          -line.cs / line.len;
        stiffMatrix._data[countPointSecond][countPointFirst + 1] +=
          -line.cs / line.len;
        stiffMatrix._data[countPointSecond + 1][countPointFirst + 1] +=
          -line.s2 / line.len;
        countPointFirst = -1;
        countPointSecond = -1;
        countBreak += 1;
      }
      if (countBreak === 3) {
        break;
      }
      countBreak = 0;
      count += 2; // x and y makes 2
    }
    count = 0;
  }

  forceMatrix = math.zeros(numberPoints * 2);
  count = 0;
  for (let point of pointList) {
    if (point.number === 2) {
      forceMatrix._data[count + 1] = weightForce;
    }
    count += 2; // x and y makes 2
  }

  return [stiffMatrix, forceMatrix];
}

function applyBoundary() {
  let count = 0;
  rowsTemp = [...Array(stiffMatrix._size[0]).keys()];
  for (let point of pointList) {
    if (xyConstraintList.includes(point.number)) {
      rowsTemp = arrayRemove(count, rowsTemp);
      rowsTemp = arrayRemove(count + 1, rowsTemp);
    }
    if (xConstraintList.includes(point.number)) {
      rowsTemp = arrayRemove(count, rowsTemp);
    }
    if (yConstraintList.includes(point.number)) {
      rowsTemp = arrayRemove(count + 1, rowsTemp);
    }
    count += 2; // x and y makes 2
  }
  stiffMatrix = math.subset(stiffMatrix, math.index(rowsTemp, rowsTemp));
  forceMatrix = math.subset(forceMatrix, math.index(rowsTemp));

  return [stiffMatrix, forceMatrix, rowsTemp];
}

function Analyze() {
  try {
    solution = math.lusolve(math.multiply(stiffMatrix, E * Area), forceMatrix);
  } catch (err) {
    alert("Truss unstable!");
  }
}

function stressResults() {
  let generalSolution = Array(pointList.length * 2).fill(0);

  for (let i = 0; i < rowsTemp.length; ++i) {
    generalSolution[rowsTemp[i]] = solution._data[i][0];
  }

  let count = 0;
  let countPoint = 0;
  let stress = 0;
  lineStress = [];
  // let csMatrix;
  let newPointX1, newPointX2, newPointY1, newPointY2, newLength, deltaLength;
  // let elementDisp = math.matrix(math.zeros([4,1]), 'dense');
  for (let line of lineList) {
    for (let point of pointList) {
      if (point.number === line.pointFirst.number) {
        newPointX1 = line.pointFirst.x + generalSolution[count];
        newPointY1 = line.pointFirst.y + generalSolution[count + 1];
        countPoint += 1;
      }
      if (point.number === line.pointSecond.number) {
        newPointX2 = line.pointSecond.x + generalSolution[count];
        newPointY2 = line.pointSecond.y + generalSolution[count + 1];
        countPoint += 1;
      }
      if (countPoint === 2) {
        break;
      }
      count += 2;
    }
    newLength =
      lenScale *
      ((newPointX2 - newPointX1) ** 2 + (newPointY2 - newPointY1) ** 2) ** 0.5;
    deltaLength = newLength - line.len;
    stress = ((E * deltaLength) / line.len) * stressScale;
    lineStress.push(stress);
    countPoint = 0;
    count = 0;
  }
  return lineStress;
}

function drawResults() {
  drawStressFigure(lineList, lineStress);
}

function drawStressFigure(lineListLoc, lineStressLoc){
  clearScreen();
  drawSupports();
  debugger;
  let count = 0;
  for (let lineIter of lineListLoc) {
    drawLine(lineIter, lineStressLoc[count]);
    count += 1;
  }
}

function addUniquePoint(point, pointList) {
  for (let p of pointList) {
    if (point.number == p.number) {
      return pointList;
    }
  }
  pointList.push(point);
  return pointList;
}

function checkBoundaryX(coordinate) {
  if (coordinate >= 0 && coordinate <= canvasWidth) {
    return true;
  } else {
    alert("Draw within the grid.");
  }
}
function checkBoundaryY(coordinate) {
  if (coordinate >= 0 && coordinate <= canvasHeight) {
    return true;
  } else {
    alert("Draw within the grid.");
  }
}

function checkTruss() {
  let countLine = 0;
  let countSupport = 0;
  let countBadPoints = 0;
  for (let point of pointList) {
    for (let line of lineList) {
      if (
        point.number === line.pointFirst.number ||
        point.number === line.pointSecond.number
      ) {
        countLine += 1;
      }
    }
    if (point.number == 0 || point.number == 1 || point.number == 2) {
      countSupport += 1;
    }

    if (countSupport == 0 && countLine < 2) {
      countBadPoints += 1;
    }
    countLine = 0;
    countSupport = 0;
  }
  if (countBadPoints > 0) {
    alert(
      "There are " +
        countBadPoints +
        " joints that are not on a support or connected to at least two elements"
    );
  }
}

function snapToPoint(point, pointList, tol) {
  for (let p of pointList) {
    if (p.distanceTo(point) < tol) {
      return p;
    }
  }
  return point;
}

function Point(x, y, number) {
  this.number = number;
  this.x = x;
  this.y = y;
  this.distanceTo = function(P) {
    return ((x - P.x) ** 2 + (y - P.y) ** 2) ** 0.5;
  };
}

function arrayRemove(value, arr) {
  return arr.filter(function(ele) {
    return ele !== value;
  });
}

function arrayRemovePoint(point, pointList) {
  return pointList.filter(function(p) {
    return p.number !== point.number;
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

function stressColor(stress) {
  let ratio = Math.abs(stress) / Fy;
  let black = [0, 0, 0];
  let blue = [0, 0, 255];
  let green = [0, 255, 0];
  let red = [255, 0, 0];
  let color = [0, 0, 0];
  if (ratio >= 0 && ratio <= 0.33) {
    color[0] = 0;
    color[1] = 0;
    color[2] = Math.floor((ratio / 0.33) * 255);
  } else if (ratio > 0.33 && ratio <= 0.66) {
    color[0] = 0;
    color[1] = Math.floor(((ratio - 0.33) / 0.33) * 255);
    color[2] = Math.floor((1 - (ratio - 0.33) / 0.33) * 255);
  } else if (ratio > 0.66) {
    color[0] = Math.floor(((ratio - 0.66) / 0.33) * 255);
    color[1] = Math.floor((1 - (ratio - 0.66) / 0.33) * 255);
    color[2] = 0;
  }
  return "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
}

function drawLine(line, lineStress = 0) {
  ctx.lineWidth = trussWidth;
  if (lineStress === 0) {
    // ctx.strokeStyle = trussColor;
    ctx.strokeStyle = trussColor;
  } else {
    ctx.strokeStyle = stressColor(lineStress);
  }

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

  this.theta = Math.atan(
    (pointSecond.y - pointFirst.y) / (pointSecond.x - pointFirst.x)
  );
  this.len =
    ((pointFirst.x - pointSecond.x) ** 2 +
      (pointFirst.y - pointSecond.y) ** 2) **
      0.5 *
    lenScale;
  this.c2 = Math.cos(this.theta) ** 2;
  this.cs = Math.cos(this.theta) * Math.sin(this.theta);
  this.s2 = Math.sin(this.theta) ** 2;
  this.c = Math.cos(this.theta);
  this.s = Math.sin(this.theta);
}

function updateGameArea(line, lineListLoc, pointListLoc) {
  pointListLoc = arrayRemovePoint(line.pointFirst, pointListLoc);
  pointListLoc = arrayRemovePoint(line.pointSecond, pointListLoc);
  lineList = arrayRemove(line, lineListLoc);
  clearScreen();
  drawSupports();
  emptyVars();

  for (let lineIter of lineList) {
    drawLine(lineIter);
  }
  return [lineListLoc, pointListLoc];
}

startGame();
