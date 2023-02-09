/**
 * 
 */
    //var gl;
	var canvasWidth=900;
	var canvasHeight=500;
    var scene=new THREE.Scene();
    var camera=new THREE.PerspectiveCamera(75, canvasWidth/canvasHeight, 0.1, 1000);
    //var denom=120;
    //var camera=new THREE.OrthographicCamera(-canvasWidth/denom,canvasWidth/denom,canvasHeight/denom,-canvasHeight/denom,0.1,10);
    var renderer=new THREE.WebGLRenderer();
    
    var line;
    var originalPath;
    var curvedPath;
    var sphere;
    
    var backRed=1.0;
    var backGreen=0;
    var backBlue=0;
    
    var direction2Buffer;
    var direction2ColorBuffer;
    
    var bodyX=0,bodyY=0,bodyZ=0;
    var sinkDepth=0;
    
    var xSize=7,ySize=xSize;
    
    var density=0;
    var noOfXPoints=60,noOfYPoints=60;
    var noOfPoints=noOfXPoints*noOfYPoints;
    var dx=xSize/(noOfXPoints-1),dy=ySize/(noOfYPoints-1);
    var points=new Array(noOfXPoints);
    var originalPathPoints=[];
    var curvedPathPoints=[];
    var radiusStep=dx;
    var MaxRadius=1;
    var bodyRadius=0;
    
    var autoChangeTheta=0;
    var autoChangePhi=0;

    var theta=0,phi=0;
    var hscrChangeTheta,hscrChangePhi;
    var hscrChangeDensity,hscrChangeRadius;
    
    var cameraRadius=6;
    
    //variables for drawing paths
	var initI=0;
	var initJ=Math.min(noOfYPoints,30);
	var pathOrientation=63;
	var hscrChangeStartX,hscrChangeStartY,hscrChangePathOrientation;

    //variables for handling mouse events
    var mouseDown=false;
    var lastMouseX=null;
    var lastMouseY=null;

    $(document).ready(function(){
        hscrChangeTheta=document.getElementById("changeTheta");
        hscrChangePhi=document.getElementById("changePhi");
        hscrChangeDensity=document.getElementById("changeDensity");
        hscrChangeRadius=document.getElementById("changeRadius");
        hscrChangeStartX=document.getElementById("changeStartX");
        hscrChangeStartY=document.getElementById("changeStartY");
        hscrChangePathOrientation=document.getElementById("changePathOrientation");
        var i,j;
        for(i=0;i<noOfXPoints;i++){
        	points[i]=new Array(noOfYPoints);
        	for(j=0;j<noOfYPoints;j++){
        		points[i][j]=new Array(3);
        	}
        }
        MaxRadius=hscrChangeRadius.max*dx;
        changeTheta();
        changePhi();
    });

    function initPoints(){
    	var i,j,x,y;
    	sinkDepth=2*density*bodyRadius;
    	for(i=0;i<noOfXPoints;i++){
    		for(j=0;j<noOfYPoints;j++){
    			x=i*dx-xSize/2;
    			y=j*dy-ySize/2;
    			points[i][j][0]=x;
    			points[i][j][1]=y;
    			points[i][j][2]=planeZ(x,y);
    		}
    	}
    }
    
    function planeZ(x,y){
    	var z=0,r2=0;
		var r=Math.sqrt(Math.pow(x-bodyX,2)+Math.pow(y-bodyY,2));
		if(r<=bodyRadius){
			z=-Math.sqrt(Math.pow(bodyRadius,2)-Math.pow(r,2))+bodyZ-sinkDepth;    				
		}
		else if(r<=bodyRadius+sinkDepth){
			r2=bodyRadius+sinkDepth-r;
			z=Math.sqrt(Math.pow(sinkDepth,2)-Math.pow(r2,2))+bodyZ-sinkDepth;
		}
		else{
			z=0;
		}
    	return z;
    }
    
    function initPathPoints(){
    	var pathOrientationTangent=Math.tan(pathOrientation*Math.PI/180);
    	var xStep=dx,yStep=pathOrientationTangent*dy;
    	var xCurvedStep=dx,yCurvedStep=pathOrientationTangent*dy;
    	//var noOfCandidatePoints=10;
    	//var minDist=0,newDist=0;
    	//initI=0;
    	//initJ=Math.min(noOfYPoints,3);
    	//*****************
    	//* ORIGINAL PATH *
    	//*****************
		//1. Διαγραφή προηγούμενων σημείων
		while(originalPathPoints.length>0) {
			originalPathPoints.pop();
		}
    	var pathX=initI*dx-xSize/2;
    	var pathY=initJ*dy-ySize/2;
    	var pathZ=0;
    	var done=false;
    	//2. Ορισμός νέων σημείων
    	while(!done){
    		originalPathPoints.push(pathX);
    		originalPathPoints.push(pathY);
    		originalPathPoints.push(pathZ);
    		pathX+=xStep;
    		pathY+=yStep;
    		if (Math.abs(pathX)>=xSize/2 || Math.abs(pathY)>=ySize/2) done=true;
    	}
    	//***************
    	//* CURVED PATH *
    	//***************
		//1. Διαγραφή προηγούμενων σημείων
		while(curvedPathPoints.length>0) {
			curvedPathPoints.pop();
		}
    	pathX=initI*dx-xSize/2;
    	pathY=initJ*dy-ySize/2;
		pathZ=planeZ(pathX,pathY);
    	done=false;
    	//var i,j;
    	//var candidateX=0,candidateY=0,candidateZ=0;
    	//var newX=0,newY=0,newZ=0;
    	var nNew=0,nOld=1;
    	var sinTheta1=0,sinTheta2=0;

    	//2. Ορισμός νέων σημείων
    	while(!done){
    		curvedPathPoints.push(pathX);
    		curvedPathPoints.push(pathY);
    		curvedPathPoints.push(pathZ);

    		nNew=1+Math.abs(pathZ/3);
    		sinTheta1=yCurvedStep/Math.sqrt(Math.pow(xCurvedStep,2)+Math.pow(yCurvedStep,2));
    		sinTheta2=nOld*sinTheta1/nNew;
    		arcSin=Math.asin(sinTheta2);
    		pathX+=xCurvedStep;
    		yCurvedStep=xCurvedStep*Math.tan(arcSin);
    		//if(pathY>bodyY || pathZ==0){
    			pathY=pathY+yCurvedStep;
    		//}
    		//else{
    			//pathY=pathY-yCurvedStep;
    		//}
    		pathZ=planeZ(pathX,pathY);


    		//ΕΥΡΕΣΗ ΣΥΝΤΟΜΟΤΕΡΗΣ ΔΙΑΔΡΟΜΗΣ
/*
    		if(pathZ==0){
    			pathX+=xCurvedStep;
    			pathY+=yCurvedStep;
    			pathZ=planeZ(pathX,pathY);
    		}
    		else{
        		candidateX=pathX+xCurvedStep;
        		candidateY=pathY+yCurvedStep;
        		candidateZ=planeZ(candidateX,candidateY);
        		newX=candidateX;
        		newY=candidateY;
        		newZ=candidateZ;
        		minDist=minimumDistance(pathX,pathY,pathZ,candidateX,candidateY,candidateZ);
        		//Σάρωση κατά το x-άξονα (το candidateY ΔΕΝ αλλάζει)
        		for(i=Math.floor(noOfCandidatePoints/2);i<=noOfCandidatePoints;i++){//η τιμή i=0 έχει ελεγχθεί κατά την αρχικοποίηση
        			candidateX=pathX+i*dx/(noOfCandidatePoints-1);
            		candidateZ=planeZ(candidateX,candidateY);
            		newDist=minimumDistance(pathX,pathY,pathZ,candidateX,candidateY,candidateZ);
            		if (newDist<minDist){
            			minDist=newDist;
                		newX=candidateX;
                		newY=candidateY;
                		newZ=candidateZ;        			
            		}
        		}
        		//Σάρωση κατά τον y-άξονα (το candidateX ΔΕΝ αλλάζει)
        		candidateX=pathX+xCurvedStep;
        		for(j=Math.floor(noOfCandidatePoints/2);j<=noOfCandidatePoints;j++){
        			candidateY=pathY+j*yCurvedStep/(noOfCandidatePoints-1);
            		candidateZ=planeZ(candidateX,candidateY);
            		newDist=minimumDistance(pathX,pathY,pathZ,candidateX,candidateY,candidateZ);
            		if (newDist<minDist){
            			minDist=newDist;
                		newX=candidateX;
                		newY=candidateY;
                		newZ=candidateZ;        			
            		}
        		}
        		pathX=newX;
        		pathY=newY;
        		pathZ=newZ;
    		}
*/
    		if (Math.abs(pathX)>=xSize/2 || Math.abs(pathY)>=ySize/2) done=true;    			
    	}
    }
    
    function minimumDistance(pathX,pathY,pathZ,candidateX,candidateY,candidateZ){
    	return Math.sqrt(Math.pow(pathX-candidateX,2)+Math.pow(pathY-candidateY,2)+Math.pow(pathZ-candidateZ,2));
    }
    
    function initGeometry(){
    	scene.remove(line);
    	scene.remove(sphere);
    	scene.remove(originalPath);
    	scene.remove(curvedPath);
    	initPlane();
    	initPaths();
    	initBody();
    }

    function initPlane(){
    	//Ορισμός δυναμικά μεταβαλλόμενου σχήματος
    	/*planeGeometry.dynamic=true;
    	planeGeometry.verticesNeedUpdate=true;
    	*/
        var planeGeometry=new THREE.Geometry();

        var i,j;
		var planeMaterial=new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 1, fog:false});
		//1. Διαγραφή προηγούμενων σημείων
		while(planeGeometry.vertices.length>0) {
			planeGeometry.vertices.pop();
		}
		//2. Ορισμός νέων σημείων
		//2α. Geometry πρώτης κατεύθυνσης
        for(i=0;i<noOfXPoints;i++){
        	for(j=0;j<noOfYPoints-1;j++){
        		var v1=new THREE.Vector3(points[i][j][0] , points[i][j][1] , points[i][j][2]);
        		var v2=new THREE.Vector3(points[i][j+1][0] , points[i][j+1][1] , points[i][j+1][2]);
        		planeGeometry.vertices.push(v1,v2);
        	}
        }
        //2β. Geometry δεύτερης κατεύθυνσης
        for(j=0;j<noOfYPoints;j++){
        	for(i=0;i<noOfXPoints-1;i++){
        		var v1=new THREE.Vector3(points[i][j][0] , points[i][j][1] , points[i][j][2]);
        		var v2=new THREE.Vector3(points[i+1][j][0] , points[i+1][j][1] , points[i+1][j][2]);
        		planeGeometry.vertices.push(v1,v2);
        	}
        }
		line=new THREE.Line(planeGeometry,planeMaterial,THREE.LinePieces);
		scene.add(line);
    }
    
    function initPaths(){
    	//*****************
    	//* ORIGINAL PATH *
    	//*****************
        var originalPathGeometry=new THREE.Geometry();
        var i;
        //var j;
		var originalPathMaterial=new THREE.LineBasicMaterial({color: 0x0000ff, linewidth: 1, fog:false});
		//1. Διαγραφή προηγούμενων σημείων
		while(originalPathGeometry.vertices.length>0) {
			originalPathGeometry.vertices.pop();
		}
		//2. Ορισμός νέων σημείων
        for(i=0;i<originalPathPoints.length-6;i+=3){
    		var v1=new THREE.Vector3(originalPathPoints[i] , originalPathPoints[i+1] , originalPathPoints[i+2]);
    		var v2=new THREE.Vector3(originalPathPoints[i+3] , originalPathPoints[i+4] , originalPathPoints[i+5]);
    		originalPathGeometry.vertices.push(v1,v2);
        }
		originalPath=new THREE.Line(originalPathGeometry,originalPathMaterial,THREE.LinePieces);
		scene.add(originalPath);

		//***************
		//* CURVED PATH *
		//***************
        var curvedPathGeometry=new THREE.Geometry();
		var curvedPathMaterial=new THREE.LineBasicMaterial({color: 0x00ff00, linewidth: 1, fog:false});
		//1. Διαγραφή προηγούμενων σημείων
		while(curvedPathGeometry.vertices.length>0) {
			curvedPathGeometry.vertices.pop();
		}
		//2. Ορισμός νέων σημείων
        for(i=0;i<curvedPathPoints.length-6;i+=3){
    		var v1=new THREE.Vector3(curvedPathPoints[i] , curvedPathPoints[i+1] , curvedPathPoints[i+2]);
    		var v2=new THREE.Vector3(curvedPathPoints[i+3] , curvedPathPoints[i+4] , curvedPathPoints[i+5]);
    		curvedPathGeometry.vertices.push(v1,v2);
        }
        curvedPath=new THREE.Line(curvedPathGeometry,curvedPathMaterial,THREE.LinePieces);
		scene.add(curvedPath);
    }
    
    function initBody() {
		var sphereGeometry=new THREE.SphereGeometry(bodyRadius,20,40);
		var bodyMaterial=new THREE.MeshBasicMaterial({color: Math.floor(0xff*density)*0x10000});
		sphere=new THREE.Mesh(sphereGeometry,bodyMaterial);
		
		sphere.position.x=bodyX;
		sphere.position.y=bodyY;
    	sphere.position.z=bodyZ-sinkDepth;
		scene.add(sphere);
	}
    
    function webGLStart() {
    	initScene();
        initPoints();
        initPathPoints();
    	initGeometry();

    	document.getElementById("placeHodler").onmousedown=handleMouseDown;
        document.onmouseup=handleMouseUp;
        document.onmousemove=handleMouseMove;
        
        document.getElementById("changeStartX").max=noOfXPoints;
        document.getElementById("changeStartY").max=noOfYPoints;
        
        tick();
    }
    
    function initScene(){
    	renderer.setSize(canvasWidth, canvasHeight);
		document.getElementById("placeHodler").appendChild(renderer.domElement);

		camera.position.z=5;
    }

    function tick(){
    	if(autoChangeTheta==1){
    		theta++;
    		if (theta>hscrChangeTheta.max) theta=hscrChangeTheta.min;
    		hscrChangeTheta.value=theta;
    	}
    	if(autoChangePhi==1){
    		phi++;
    		if (phi>hscrChangePhi.max) phi=hscrChangePhi.min;
    		hscrChangePhi.value=phi;
    	}
    	placeCamera();
    	requestAnimationFrame(tick);
    	renderer.render(scene,camera);
    }

    function ChangeColor(){
      backRed=Math.random();
      backGreen=Math.random();
      backBlue=Math.random();
      
      var color=Math.floor(Math.random()*Math.pow(256, 3));
      renderer.setClearColor(color,1);
    }

    function RotateAxis(checkbox,Selector){
      var NewValue;
      if(checkbox.checked) {
        NewValue=1;
      }
      else {
        NewValue=0;
      }
      if(Selector==0){
        autoChangeTheta=NewValue;
      }
      else if (Selector==1){
    	  autoChangePhi=NewValue;
      }
    }
    
    function changeTheta(){
    	theta=hscrChangeTheta.value/2;
    	placeCamera();
    }
    
    function changePhi(){
    	phi=hscrChangePhi.value/2;
    	placeCamera();
    }
    
    function changeRadius(){
    	bodyRadius=radiusStep*hscrChangeRadius.value;
    	initPoints();
    	initPathPoints();
    	initGeometry();
    }
    
    function changeDensity(){
    	density=hscrChangeDensity.value/hscrChangeDensity.max;
    	initPoints();
    	initPathPoints();
    	initGeometry();
    }
    
    function placeCamera(){
    	var thetaRad=theta*Math.PI/180;
    	var phiRad=phi*Math.PI/180;
    	camera.position.x=cameraRadius*Math.cos(phiRad)*Math.cos(thetaRad);
    	camera.position.y=cameraRadius*Math.cos(phiRad)*Math.sin(thetaRad);
    	camera.position.z=cameraRadius*Math.sin(phiRad);
    	camera.lookAt(new THREE.Vector3(0,0,0));
    	document.getElementById("thetaVal").innerHTML="θ="+theta;
    	document.getElementById("phiVal").innerHTML="φ="+phi;
    	//document.getElementById("info").innerHTML="x="+camera.position.x+" y="+camera.position.y+" z="+camera.position.z;
    }

    function changeStartX(){
    	initI=hscrChangeStartX.value;
    	placeStartingPoint();
    }
    
    function changeStartY(){
    	initJ=hscrChangeStartY.value;
    	placeStartingPoint();
    }
    
    function changePathOrientation(){
    	pathOrientation=hscrChangePathOrientation.value;
    	placeStartingPoint();    	
    }

    function placeStartingPoint(){
    	document.getElementById("startXVal").innerHTML="Xo="+initI;
    	document.getElementById("startYVal").innerHTML="Yo="+initJ;
    	document.getElementById("PathOrientationVal").innerHTML="θ1="+pathOrientation;
    	initPoints();
    	initPathPoints();
    	initGeometry();
    }
    
    //mouse events
    function handleMouseDown(event){
        mouseDown=true;
        lastMouseX=event.clientX;
        lastMouseY=event.clientY;
    }

    function handleMouseUp(event){
        mouseDown=false;
    }

    function handleMouseMove(event){
        if (!mouseDown) {
          return;
        }
        var newX=event.clientX;
        var newY=event.clientY;

        var deltaX=newX-lastMouseX;
        /*var newRotationMatrix=mat4.create();
        mat4.identity(newRotationMatrix);
        mat4.rotate(newRotationMatrix,degToRad(deltaX/10),[0, 1, 0]);*/

        var deltaY=newY-lastMouseY;
        /*mat4.rotate(newRotationMatrix,degToRad(deltaY/10),[1, 0, 0]);

        mat4.multiply(newRotationMatrix,moonRotationMatrix,moonRotationMatrix);*/
        
        theta-=deltaX/10;
        phi-=deltaY/10;
        placeCamera();

        lastMouseX=newX;
        lastMouseY=newY;
    }