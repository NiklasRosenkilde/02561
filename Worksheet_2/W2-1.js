var gl;
var points;
var index;

window.onload = function init() {
  var canvas = document.getElementById("c");
  gl = WebGLUtils.setupWebGL(canvas);
  

  // Cornflower background
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var maxVerts = 100000;
  index = 0; 
  var numPoints = 0;
  var vBuffer = gl.createBuffer();
  
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, maxVerts*sizeof['vec2'], gl.STATIC_DRAW);

  var a_Position = gl.getAttribLocation(program, 'a_Position');
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  canvas.addEventListener("click", function (ev) {
    var mousepos = ev.target.getBoundingClientRect();
    var p = vec2(-1 + 2 * (ev.clientX-mousepos.left) /canvas.width , -1 + 2 * (canvas.height-ev.clientY+mousepos.top) / canvas.height);
    
    gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(p));
    numPoints = Math.max(numPoints, ++index); 
    index %= maxVerts;
    render();
    });

}

function render(){
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, index);
}
