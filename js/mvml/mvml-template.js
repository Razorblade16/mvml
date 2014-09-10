MVML.html_template = "
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>{{ title }}</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
    <link rel="stylesheet" type="text/css" href="{{&hosted_url}}/css/three.css">
    <script src="//cdnjs.cloudflare.com/ajax/libs/three.js/r67/three.min.js"></script>
    <script src="{{&hosted_url}}/js/physijs/physi.js"></script>
    <script src="{{&hosted_url}}/js/three/helpers/Detector.js"></script>
    <script src="{{&hosted_url}}/js/three/helpers/KeyboardState.js"></script>
    <script src="{{&hosted_url}}/js/three/CharacterController.js"></script>
    <script src="{{&hosted_url}}/js/three/InputEvents.js"></script>
    <script src="{{&hosted_url}}/js/three/CollisionCommander.js"></script>
    <script src="{{&hosted_url}}/js/three/FetchBlob.js"></script>
  </head>

  <body>

    <!--<div id="info"><br/>{{ motd }}<br/><br/>
    Desktop: <b>WASD</b> move, <b>mouse|arrow</b> pan<br/>
    Touch: <b>1 finger</b> pan, <b>2</b> forward, <b>3</b> backward<br/>
    </div>-->

    <script>
      var worker_blob = get_blob('{{&hosted_url}}/js/physijs/worker.js');
      var ammo_blob = get_blob('{{&hosted_url}}/js/physijs/ammo.js');
      Physijs.scripts.worker = URL.createObjectURL(worker_blob);
      Physijs.scripts.ammo = URL.createObjectURL(ammo_blob);

      var container;
      var camera, controls, scene, renderer;
      var player_mesh;
      var keyboard = new THREEx.KeyboardState();

      var SCREEN_WIDTH = window.innerWidth;
      var SCREEN_HEIGHT = window.innerHeight;
      var SCREEN_ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;

      var clock = new THREE.Clock();

      init();
      next_frame();

      function init() {
        // CONTAINER
        container = document.createElement( 'div' );
        document.body.appendChild( container );

        // SCENE
        scene = new Physijs.Scene({
          reportsize: {{ scene_count }}
        });
        scene.setGravity(new THREE.Vector3(0, -{{ player.gravity }}, 0));

        // CAMERA
        var player_height = 5;
        var player_width = player_height/2.0;
        var fov = 45;
        var aspect = SCREEN_WIDTH/SCREEN_HEIGHT;
        var near = 0.1;
        var far = 20000;
        camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        scene.add(camera);

        // LIGHT
        var light = new THREE.AmbientLight( "#404040" );
        scene.add(light);
        light = new THREE.DirectionalLight( "white", 0.25 );
        light.position.set(1,1,2);
        scene.add(light);

        // SKYBOX
        var skyBoxGeometry = new THREE.BoxGeometry( 10000, 10000, 10000 );
        var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
        var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
        scene.add(skyBox);

        // SCENE
        var manager = new THREE.LoadingManager();
        var geometry, material;
        var loader = new THREE.JSONLoader();
        {{#models}}

        <!-- Model: {{&geometry}} -->
        {{^mesh}}
        geometry = new THREE.{{ geometry }};
        {{/mesh}}
        {{#mesh}}
        loader.load('{{&geometry}}', function (geometry) {
        {{/mesh}}
        material = new THREE.MeshLambertMaterial({
          {{#texture}}
          map: THREE.ImageUtils.loadTexture('{{&texture}}')
          {{/texture}}
          {{^texture}}
          color: {{&color}}
          {{/texture}}
        });
        {{#physics}}
        obj = new Physijs.{{ bounding }}(geometry,material,{{ mass }});
        {{/physics}}
        {{^physics}}
        obj = new THREE.Mesh(geometry,material);
        {{/physics}}
        obj.position.set{{ position }};
        obj.rotation.set{{ rotation }};
        obj.scale.set{{ scale }};
        //obj.geometry.computeFaceNormals();
        scene.add(obj);
        {{#mesh}}
        });
        {{/mesh}}
        {{/models}}
        
        <!-- Player Mesh -->
        geometry = new THREE.CylinderGeometry(player_width, player_width, player_height*1.2, 12, 5);
        material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe:true });
        player_mesh = new Physijs.CapsuleMesh(geometry, material, 100);
        player_mesh.position.set{{ player.start }};
        player_mesh.position.y += player_height/2.0;
        player_mesh.visible = false;
        scene.add(player_mesh);
        player_mesh.setDamping(0.9,0.9);
        /*var floorTexture = new THREE.ImageUtils.loadTexture( 'images/checkerboard.jpg' );
        floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set( 10, 10 );
        var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );*/

        // RENDERER
        if ( Detector.webgl ) {
          renderer = new THREE.WebGLRenderer( {antialias:true} );
        }
        else {
          renderer = new THREE.CanvasRenderer();
        }
        renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
        container.appendChild( renderer.domElement );

        // CONTROLS
        character = new THREE.CharacterController( camera, player_mesh );
        character.height = player_height/2.0;
        character.movementSpeed = {{ player.move_speed }};
        character.rollSpeed = {{ player.turn_speed }};
        character.dragToLook = true;
        character.minJumpSpeed = {{ player.min_jump_speed }};
        character.maxJumpSpeed = {{ player.max_jump_speed }};
        input = new THREE.InputEvents( character );

        // EVENTS
        //THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
        window.addEventListener( 'resize', onWindowResize, false );
      };

      function onWindowResize( event ) {
        SCREEN_HEIGHT = window.innerHeight;
        SCREEN_WIDTH  = window.innerWidth;

        renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

        camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
        camera.updateProjectionMatrix();
      };

      function next_frame() {
        requestAnimationFrame( next_frame );
        renderer.render( scene, camera );
        character.update( clock.getDelta() );
        scene.simulate();
      };

      /*function input() {
        controls.moveState.forward = keyboard.pressed("w");
        controls.moveState.back = keyboard.pressed("s");
        controls.moveState.left = keyboard.pressed("a");
        controls.moveState.right = keyboard.pressed("d");

        controls.moveState.pitchUp = keyboard.pressed("up");
        controls.moveState.pitchDown = keyboard.pressed("down");
        controls.moveState.yawLeft = keyboard.pressed("left");
        controls.moveState.yawRight = keyboard.pressed("right");

        controls.updateMovementVector();
        controls.updateRotationVector();

        //case 82: controls.moveState.up = 1; break; //R
        //case 70: controls.moveState.down = 1; break; //F
        //controls.movementSpeedMultiplier = .1;
        //case 81: controls.moveState.rollLeft = 1; break; //Q
        //case 69: controls.moveState.rollRight = 1; break; //E
      }*/
";