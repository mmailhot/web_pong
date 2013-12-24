O = {
	WIDTH: 900,
	HEIGHT: 600,
	VIEW_ANGLE: 45,
	NEAR: 0.1,
	FAR: 10000
}

GAME_WIDTH = 30
GAME_HEIGHT = 20

MOUSE_X = null
MOUSE_Y = null

clamp = (number,min,max) ->
	Math.max(min, Math.min(number, max))

reflectMatrix = new THREE.Vector4(-1,0,0,0,0,-1,0,0,0,0,0,-1,0,0,0,0,-1)

class Ball
	object: null

	constructor:(x,y,z) ->
		@object = new THREE.Mesh(new THREE.SphereGeometry(0.5),new THREE.MeshPhongMaterial({color:0xBBBBBB,specular:0xBBBBBB}))
		@speed = 0.2
		#heading
		@theta = 90
		@phi = 12

		z_speed = @speed * Math.sin(@theta * Math.PI / 180) * Math.cos(@phi * Math.PI / 180)
		x_speed = @speed * Math.sin(@theta * Math.PI / 180) * Math.sin(@phi * Math.PI / 180)
		y_speed = @speed * Math.cos(@theta * Math.PI / 180)

		@velocity = new THREE.Vector3(x_speed,y_speed,z_speed)

	update:(x,y,z) ->
		#spherical -> cartersian conversion
		

		#update object
		@object.position.add(@velocity)
		@velocity.multiplyScalar(1.001)

	testCollide:(object)->
		angle = new THREE.Vector3(1 * Math.sin(@theta * Math.PI / 180) * Math.sin(@phi * Math.PI / 180),
							1 * Math.cos(@theta * Math.PI / 180),
							1 * Math.sin(@theta * Math.PI / 180) * Math.cos(@phi * Math.PI / 180))
		ray = new THREE.Raycaster(@object.position,angle,0,0.5 + @speed)
		ray.intersectObject(object,true)

	transformOnMatrix:(matrix)->
		return

	tempReverse:()->
		@velocity.z = -@velocity.z


	


class Paddle
	object: null
	light:null

	constructor:(plane,@width,@height,color,@controller)->
		materials = [
			new THREE.MeshLambertMaterial({color:color,opacity:0.5,transparent:true}),
			new THREE.MeshBasicMaterial({color:color,wireframe:true})
		]
		@object = new THREE.SceneUtils.createMultiMaterialObject(new THREE.CubeGeometry(@width,@height,1),materials)
		@object.position.z = plane

		@light = new THREE.PointLight(color,2);
		@light.position.z = plane

	update:()->
		newPos = @controller.update(@object.position.x,@object.position.y)
		@setPosition(newPos.x,newPos.y)

	setPosition:(x,y)->
		xLim = (GAME_WIDTH - @width) / 2
		yLim = (GAME_HEIGHT - @height) / 2
		@object.position.x = clamp(x,-xLim,xLim)
		@object.position.y = clamp(y,-yLim,yLim)
		@light.position.x = clamp(x,-xLim,xLim)
		@light.position.y = clamp(y,-yLim,yLim)

class RandomController
	update:(x,y)->
		return {x: x + Math.random() - 0.5, y: y + Math.random() - 0.5}

class SlowTrackerController
	speed:0.3

	constructor:(object)->
		@object = object

	update:(x,y)->
		x += clamp(@object.position.x - x,-@speed,@speed)
		y += clamp(@object.position.y - y,-@speed,@speed)
		return {x:x,y:y}

class PlayerController
	update:(x,y)->
		if(MOUSE_X)
			x = MOUSE_X / 30 - 15
		
		if(MOUSE_Y)
			y = -(MOUSE_Y / 30 - 10)
		
		return{x:x,y:y}

O.ASPECT = O.WIDTH / O.HEIGHT;

renderer = new THREE.WebGLRenderer()
camera = new THREE.PerspectiveCamera(O.VIEW_ANGLE,O.ASPECT,O.NEAR,O.FAR)
scene = new THREE.Scene();

#Add camera
scene.add(camera)
camera.position.z = 55;
renderer.setSize(O.WIDTH,O.HEIGHT);
renderer.domElement.setAttribute("id","canvasId")
document.getElementById('container').appendChild(renderer.domElement)

renderer.setClearColorHex(0x000000, 1.0)
renderer.clear()

 
bottomWall = new THREE.Mesh(new THREE.CubeGeometry(32,1,60),
               new THREE.MeshLambertMaterial({color: 0x111111}))
bottomWall.position.set(0,-10.5,0)
scene.add(bottomWall)

topWall = new THREE.Mesh(new THREE.CubeGeometry(32,1,60),
               new THREE.MeshLambertMaterial({color: 0x111111}))
topWall.position.set(0,10.5,0)
scene.add(topWall)

leftWall = new THREE.Mesh(new THREE.CubeGeometry(1,20,60),
               new THREE.MeshLambertMaterial({color: 0x111111}))
leftWall.position.set(-15.5,0,0)
scene.add(leftWall)

rightWall = new THREE.Mesh(new THREE.CubeGeometry(1,20,60),
               new THREE.MeshLambertMaterial({color: 0x111111}))
rightWall.position.set(15.5,0,0)
scene.add(rightWall)

paddleMaterials = [
	new THREE.MeshLambertMaterial({color:0xFF7F00,opacity:0.5,transparent:true}),
	new THREE.MeshBasicMaterial({color:0xFF7F00,wireframe:true})
]

paddleMaterials2 = [
	new THREE.MeshLambertMaterial({color:0x0080FF,opacity:0.5,transparent:true}),
	new THREE.MeshBasicMaterial({color:0x0080FF,wireframe:true})
]

ball = new Ball(0,0,0)
scene.add(ball.object)

playerPaddle = new Paddle(29.5,6,5,0xFF7F00,new PlayerController)
scene.add(playerPaddle.object)
scene.add(playerPaddle.light)

enemyPaddle = new Paddle(-29.5,6,5,0x0080FF,new SlowTrackerController(ball.object))
scene.add(enemyPaddle.object)
scene.add(enemyPaddle.light)

pointLight = new THREE.PointLight(0xFF7F00,0);
pointLight.position.set(0,0,0)
scene.add(pointLight)

#Load Shadow
shadowTexture = THREE.ImageUtils.loadTexture('../img/shadow.png')
shadowMaterial = new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true})
shadow = new THREE.Mesh(new THREE.CubeGeometry(1,0.0001,1),shadowMaterial)
shadow.position.set(0,-9.9,0)
scene.add(shadow)



renderer.render(scene, camera);

document.getElementById('canvasId').onmousemove = (e) ->
	MOUSE_X = e.pageX - this.offsetLeft
	MOUSE_Y = e.pageY - this.offsetTop	

update = ()->
	enemyPaddle.update()
	playerPaddle.update()
	a = ball.testCollide(playerPaddle.object)
	b = ball.testCollide(enemyPaddle.object)
	if(a.length > 0 || b.length > 0)
		ball.tempReverse()
	ball.update()

	shadow.position.x = ball.object.position.x
	shadow.position.z = ball.object.position.z
	
	renderer.render(scene, camera);
	requestAnimationFrame(update) 

requestAnimationFrame(update)