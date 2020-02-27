
export default () => {

function startGame() {
    myGameArea.start();        
    makeLine();
}

function component(baseWidth, height, color, x, y, type){
    this.baseWidth = baseWidth;
    this.height = height;
    this.x = x;
    this.y = y - height;
    ctx = myGameArea.context;

    if (type == "pinSupport"){
        hatchPercent = 0.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + baseWidth / 2, y);
        ctx.lineTo(x, y - height);
        ctx.lineTo(x - baseWidth / 2, y);
        ctx.fill();
        ctx.moveTo(x - baseWidth, y);
        ctx.lineTo(x + baseWidth, y);            
        ctx.stroke();
        delta = height * hatchPercent;
        NumberOfHatches = Math.floor(baseWidth / delta);
        for (i = 0; i < NumberOfHatches; ++i){
            ctx.moveTo(x - baseWidth + (i - 1) * delta, y + delta);
            ctx.lineTo(x - baseWidth + i * delta, y);
            ctx.stroke();
        }
        for (i = 0; i < NumberOfHatches + 1; ++i){
            ctx.moveTo(x + (i - 1) * delta, y + delta);
            ctx.lineTo(x + i * delta, y);
            ctx.stroke();
        }
    }
    else if (type == "rollSupport"){
        hatchPercent = 0.2;
        ctx.beginPath()
        ctx.arc(x, y - height / 2, height / 2, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.moveTo(x - baseWidth, y);
        ctx.lineTo(x + baseWidth, y);            
        ctx.stroke();
        delta = height * hatchPercent;
        NumberOfHatches = Math.floor(baseWidth / delta);
        for (i = 0; i < NumberOfHatches; ++i){
            ctx.moveTo(x - baseWidth + (i - 1) * delta, y + delta);
            ctx.lineTo(x - baseWidth + i * delta, y);
            ctx.stroke();
        }
        for (i = 0; i < NumberOfHatches + 1; ++i){
            ctx.moveTo(x + (i - 1) * delta, y + delta);
            ctx.lineTo(x + i * delta, y);
            ctx.stroke();
        }
    }
    
}

function makeLine(){
    var firstX = 0;
    var firstY = 0;
    var secondX = 0;
    var secondY = 0;
    var lineList = [];
    var pointList = [];
    var pinPoint = new Point(pinSupport.x, pinSupport.y);
    var rollPoint = new Point(rollSupport.x, rollSupport.y);
    pointList.push(pinPoint, rollPoint);
    
    onmousedown = function(e){
        firstX = e.clientX;
        firstY = e.clientY;
    }
    onmouseup = function(e){
        secondX = e.clientX;
        secondY = e.clientY;
        if (secondX != firstX || secondY != firstY){
            var pointFirst = new Point(firstX, firstY);
            var pointSecond = new Point(secondX, secondY);
            
            pointFirst = snapToPoint(pointFirst, pointList, myGameArea.snapTol);
            pointSecond = snapToPoint(pointSecond, pointList, myGameArea.snapTol);
            pointList.push(pointFirst, pointSecond);
            lineList.push(new Line(pointFirst, pointSecond, myGameArea.xTol));
            drawLine(lineList[lineList.length - 1]);
        }
    }
    ondblclick = function(e){
        var point = new Point(e.clientX, e.clientY);
        for (var line of lineList){
            if (isPointOnLine(point, line, myGameArea.deleteTol)){
                lineList = updateGameArea(line, lineList);
                break;
            }
        }
    }
    
}



function snapToPoint(point, pointList, tol){
    for (p of pointList){
        if (p.distanceTo(point) < tol){
            return p;
        }
    }
    return point;
}


function Point(x, y) {
    this.x = x;
    this.y = y;
    this.distanceTo = function (P){
        return ((x - P.x)**2 + (y - P.y)**2) ** 0.5;
    }
}

function arrayRemove(value, arr) {
   return arr.filter(function(ele){
       return ele != value;
   });

}

function isPointOnLine(point, Line, tol){
    if (Line.a === undefined){
        if (Math.abs(point.x - Line.pointFirst.x) < tol){
            return true;
        } else {
            return false;
        }
    } else{
    var intersectX = (point.x * (Line.pointSecond.x - Line.pointFirst.x) + (point.y - Line.b) * (Line.pointSecond.y - Line.pointFirst.y)) / (Line.pointSecond.x - Line.pointFirst.x + Line.a * (Line.pointSecond.y - Line.pointFirst.y));
    var intersectY = Line.a * intersectX + Line.b;
    var dist = ((point.x - intersectX) ** 2 + (point.y - intersectY) ** 2) ** 0.5;
    return (dist < tol) ? true : false;
    }
}

function drawLine(line){
    ctx = myGameArea.context;
    ctx.lineWidth = myGameArea.trussWidth;
    ctx.strokeStyle = myGameArea.trussColor;
    ctx.beginPath();
    ctx.moveTo(line.pointFirst.x, line.pointFirst.y);
    ctx.lineTo(line.pointSecond.x, line.pointSecond.y);
    ctx.stroke();
    if (myGameArea.drawJoints = true){
        ctx.fillStyle = myGameArea.jointColor;
        ctx.beginPath();
        ctx.arc(line.pointFirst.x, line.pointFirst.y, myGameArea.jointRadius, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(line.pointSecond.x, line.pointSecond.y, myGameArea.jointRadius, 0, Math.PI * 2, true);
        ctx.fill();
    }
}


function Line(pointFirst, pointSecond, tol){
    this.pointFirst = pointFirst;
    this.pointSecond = pointSecond;
    
    this.a = Math.abs(pointSecond.x - pointFirst.x) > tol ? (pointSecond.y - pointFirst.y)/(pointSecond.x - pointFirst.x): undefined;
    this.b = Math.abs(pointSecond.x - pointFirst.x) > tol ? pointFirst.y - this.a * pointFirst.x : - pointFirst.y;

}

function updateGameArea(line, lineList){
    lineList = arrayRemove(line, lineList);
    myGameArea.clear();
    // myGameArea.start();
    for (line of lineList){
        drawLine(line);
    }
    return lineList;
}

var myGameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        // this.canvas.width = 480;
        // this.canvas.height = 270;
        id = "grid";
        var canvas = document.getElementById(id);
        var ctx = canvas.getContext('2d');
        this.context = ctx;
        ctx.globalCompositeOperation = 'destination-over';
        this.canvasWidth = 480;
        this.canvasHeight = 270;
        ctx.canvas.width  = this.canvasWidth;
        ctx.canvas.height = this.canvasHeight;
        
    
        var data = '<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"> \
            <defs> \
                <pattern id="smallGrid" width="8" height="8" patternUnits="userSpaceOnUse"> \
                    <path d="M 8 0 L 0 0 0 8" fill="none" stroke="gray" stroke-width="0.5" /> \
                </pattern> \
                <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"> \
                    <rect width="80" height="80" fill="url(#smallGrid)" /> \
                    <path d="M 80 0 L 0 0 0 80" fill="none" stroke="gray" stroke-width="1" /> \
                </pattern> \
            </defs> \
            <rect width="100%" height="100%" fill="url(#smallGrid)" /> \
        </svg>';

        var DOMURL = window.URL || window.webkitURL || window;

        this.img = new Image();
        this.svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
        this.url = DOMURL.createObjectURL(this.svg);

        this.img.onload = function () {
          ctx.drawImage(this, 0, 0);
        //   DOMURL.revokeObjectURL(this.url);
        }
        this.img.src = this.url;
        
        this.xTol = 1;
        //line distance tolerance
        this.deleteTol = 20;
        //canvas default tolerance
        ctx.lineWidth = 1;
        //truss line color
        this.trussColor = "black";
        //truss line width
        this.trussWidth = 5;
        // snap to point tolerance
        this.snapTol = 15;
        // draw joints?
        this.drawJoints = true;
        this.jointColor = "red";
        this.jointRadius = 5;



        
        pinSupport = new component(20,20, "red", 50, 200, "pinSupport");
        rollSupport = new component(20,20, "red", 430, 200, "rollSupport");

        // this.interval = setInterval(updateGameArea, 20);

    },
    clear: function(){
        this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        ctx.canvas.width  = this.canvasWidth;
        ctx.canvas.height = this.canvasHeight;
        this.img.onload = function () {
          ctx.drawImage(this, 0, 0);
        //   DOMURL.revokeObjectURL(this.url);
        }
        this.img.src = this.url;

        pinSupport = new component(20,20, "red", 50, 200, "pinSupport");
        rollSupport = new component(20,20, "red", 430, 200, "rollSupport");
    }
}

};