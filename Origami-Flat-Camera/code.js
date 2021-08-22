import { RPM } from "../path.js"
import { CameraProperties } from "../../System/System/CameraProperties.js";
import { MapPortion } from "../../System/Core/MapPortion.js";
import { MapObject } from "../../System/Core/MapObject.js";
import { Camera } from "../../System/Core/Camera.js";
import {Map} from "../../System/Scene/Map.js";
import { System, Manager, Datas, Scene} from "../../System/index.js";
const pluginName = "Origami-Flat-Camera";
const inject = RPM.Manager.Plugins.inject;

// Start code here
/*
* Creator U.K.L
* Allows Camera to transition from 2D to 3D...
* 
* Usage: Call the following in an event script. Then use RPM.currentMap.{function here} ie. RPM.currentMap.TransitionTo2D()
* 
* Transitions the scene from 3D to 2D.
* TransitionTo2D()
* Transitions the scene from 2D to 3D.
* TransitionTo3D()
* Transitions to the opposing camera. 3D -> 2D, or 2D -> 3D.
* TransitionToNextCam()
* Changes Camera without transitioning. Type in "Orthographic" or "Perspective"
* RPM.currentMap.ChangeToCamera("Orthographic") this changes it to 2D.
* ChangeToCamera()
* Can determine if transition is over for events. Use loop script command.
* FinishedCamTrans()
*/



(function() {

    
    var cameras = {};
    
    //The angle set by camera file.
    var originAngle = 0;
    //Elevation level of player before starting.
    var originROT = 0; //Original angle for facing planes.

    var CamTransitioning = false; //Determines if the transitioning sequence is occuring. Also informs what is transitioning (2D or 3D?)
    var transitionFaceSprites = false;
    //Changes camera into orthographic 2D camera.
    Map.prototype.TransitionTo2D =  function(){
        CamTransitioning = "2D"

        console.log("In Map Transition");
        //Only when transition from 3D does it set these variables.
        //RPM.Scene
        /*
        if(RPM.currentMap.camera.threeCamera.fov){
            originROT = RPM.game.hero.mesh.rotation.x; //Original rotation. All face sprites are rotated.
        }

        transitionFaceSprites = false
        this.updateTransitionCameras(CamTransitioning); 
        */
    }

    //Changes camera into perspective 3D camera.
    Map.prototype.TransitionTo3D =  function(){
        
        originAngle = cameras["Original"].verticalAngle;
        CamTransitioning = "3D"
        transitionFaceSprites = false
        this.updateTransitionCameras(CamTransitioning); 
    }
    /*

    //Transitions to the opposite current camera...2D -> 3D, 3D -> 2D.
    Map.prototype.TransitionToNextCam =  function(){
        if(RPM.currentMap.camera.threeCamera.fov)
            this.TransitionTo2D();
        else
            this.TransitionTo3D();

    }

    //Changes camera WITHOUT transitions.
    Map.prototype.ChangeToCamera =  function(cam){
        RPM.currentMap.camera = cameras[cam];
        if(cam === "Orthographic"){
            this.RotateAllFaceSprites(55.5, false);
        }else if(cam === "Perspective"){
            this.RotateAllFaceSprites(0, false);
        }
    }

    //Checks if camera is finished transitioning
    Map.prototype.FinishedCamTrans =  function(){
        if(CamTransitioning)
            return false;
        else
            return true;
    }


    
    ///------------------------------------------------
    /// Handles transitions of the cameras.
    ///------------------------------------------------

    
    var Alias_update = Map.prototype.update;
    Map.prototype.update =  function(){  
        Alias_update.call(this);
        if(CamTransitioning)
            this.updateTransitionCameras(CamTransitioning);
    }

    //This event is called by the methods given to end users.
    //Controls the sequence and input of switching cameras from 2D to 3D.
    Map.prototype.updateTransitionCameras =  function(Dim){
        //Checks if has a fov, if not then it is orthographic.
        if(this.camera.threeCamera.fov){
            //It is 3D
            if(Dim === "3D") //Are we transitioning to 3D while still in 3D?
                if(transitionFaceSprites) //When going to 3D, we need to turn perspective back on.
                {

                    RPM.currentMap.camera = cameras["Perspective"];
                    this.TranCam2DTo3D();
                }

                else //If done transition turn off.
                    CamTransitioning = false;
            else{ // Now we transition from 3D to 2D.
                RPM.currentMap.camera = cameras["Perspective"];
                this.TranCam3DTo2D();
            }
        }
        else{//It contains no fov, so it must be 2D.
            if(Dim === "2D"){
                CamTransitioning = false;
            }
            else{
                this.TranCam2DTo3D();
                
            }
        }
    }

    Map.prototype.TranCam3DTo2D = function(){

        let turningAngle = 0.0125*RPM.currentMap.camera.verticalAngle;
        //clamping
        if(turningAngle < 5.5)
            turningAngle = 5.5;

        transitionCameraTo2D(this.camera, -1, RPM.currentMap.camera.verticalAngle);
        this.RotateAllFaceSprites(turningAngle, false);

        //When the angle is close to desired result then...
        if( Math.abs(RPM.currentMap.camera.verticalAngle) < 5){
            turningAngle = 55.5;
            RPM.game.hero.move(0,0,0,0);    
            //When finished change camera.
            this.camera = cameras["Orthographic"];

            this.RotateAllFaceSprites(turningAngle, false);
            
        }


    }

    Map.prototype.TranCam2DTo3D = function(){

        transitionFaceSprites = true;
        let turningAngle = RPM.currentMap.camera.verticalAngle*-0.0195;

        if( Math.abs(RPM.currentMap.camera.verticalAngle - originAngle) < 5){
            turningAngle = originROT;
            transitionFaceSprites = false;
            RPM.game.hero.move(0,0,0,0);
            

        }
        
        transitionCameraTo3D(this.camera, -1, RPM.currentMap.camera.verticalAngle);
        this.RotateAllFaceSprites(turningAngle, false);

        //Changes camera to perspective after transitioning is complete.
        if(!transitionFaceSprites)
            RPM.currentMap.camera = cameras["Original"];
        else
            RPM.currentMap.camera = cameras["Perspective"];
        
    }


    Map.prototype.RotateAllFaceSprites = function(turningAngle){
        // Update face sprites
        if (!this.isBattleMap) 
        {
            // Update the objects
            RPM.game.hero.updateRot2DCam(turningAngle);
            this.updatePortions(this, function(x, y, z, i, j, k)
            {
                // Update face sprites
                let mapPortion = this.getMapPortion(i, j, k);
                
                if (mapPortion)
                {
                    mapPortion.updateFaceSprites2D(turningAngle);
                }
            });
        }
    }
    
    var transitionCameraTo2D = function(camera, timeLeft, originAngle){

        // Updating the time left
        let dif;
        if(timeLeft <= 0){
            timeLeft = 5000;
        }

        timeRate = 0.0625;
        let timeLeftRate = 6.2;
        dif = RPM.elapsedTime;
        timeLeft -= RPM.elapsedTime*timeLeftRate;

        if (timeLeft < 0) 
        {
            dif += timeLeft;
            timeLeft = 0;
        }

        RPM.currentMap.camera.updateTargetPosition();
        RPM.currentMap.camera.updateAngles();
        RPM.currentMap.camera.updateDistance();

        // Rotation


        RPM.currentMap.camera.horizontalAngle = 270;
        RPM.currentMap.camera.verticalAngle = ( (originAngle) )*( (timeLeft/5000) );
        // Zoom
        RPM.currentMap.camera.distance += (timeRate *  timeRate)*timeLeftRate*60;

        // Update
        RPM.currentMap.camera.update();
        

        return originAngle;
    }

    var transitionCameraTo3D = function(camera, timeLeft, originAngle){

        // Updating the time left
        let dif;
        if(timeLeft <= 0){
            timeLeft = 5000;
        }

        timeRate = 0.0625;
        let timeLeftRate = 6.2;
        dif = RPM.elapsedTime;
        timeLeft -= RPM.elapsedTime*timeLeftRate;

        if (timeLeft < 0) 
        {
            dif += timeLeft;
            timeLeft = 0;
        }

        RPM.currentMap.camera.updateTargetPosition();
        RPM.currentMap.camera.updateAngles();
        RPM.currentMap.camera.updateDistance();

        // Rotation


        RPM.currentMap.camera.horizontalAngle = 270;
        RPM.currentMap.camera.verticalAngle += 0.001*RPM.elapsedTime*( (originAngle) )*( (timeLeft/5000) );
        // Zoom
        RPM.currentMap.camera.distance -= (timeRate *  timeRate)*timeLeftRate*55;

        // Update
        RPM.currentMap.camera.update();



        return originAngle;
    }

    //--------------------------------------------
    // Handles System camera properties for creating three cameras.
    // Original: Used to store Json data, Perspective, Orthographic.
    //----------------------------------------
    var Alias_InitializeCamera = CameraProperties.prototype.initializeCamera;

    CameraProperties.prototype.initializeCamera = function(camera)
    {
        if(this.fov == "2D") //The fov is not used for ortho, and set to 2D.
            this.initializeOrthoCamera(camera); 
        else
            Alias_InitializeCamera.call(this, camera);
    }

    //Handles setting properties for orthographic camera.
    CameraProperties.prototype.initializeOrthoCamera = function(camera){

        //The width and height are divided such that it perserves the original 640/480 ratio.
        camera.threeCamera = new THREE.OrthographicCamera(RPM.CANVAS_WIDTH / -4, RPM.CANVAS_WIDTH / 4,
            RPM.CANVAS_WIDTH / 6, RPM.CANVAS_WIDTH / -6, 1, 1000);
        //Keeps user given distance.
        camera.distance = this.distance;
        //Rotates 270 degrees to cancel out any rotations.
        camera.horizontalAngle = 270;
        //Set to 0, to perserve X axis. The skewed sprites are fixed by rotating them 55 degrees along X axis.
        camera.verticalAngle = 0;
        camera.verticalRight = true;

        //Corrects any offsets given by editor.
        camera.targetPosition = new THREE.Vector3();
        let x = this.targetOffsetX;
        if (this.isSquareTargetOffsetX)
        {
            x *= RPM.SQUARE_SIZE;
        }
        let y = this.targetOffsetY;
        if (this.isSquareTargetOffsetY)
        {
            y *= RPM.SQUARE_SIZE;
        }
        let z = this.targetOffsetZ;
        if (this.isSquareTargetOffsetZ)
        {
            z *= RPM.SQUARE_SIZE;
        }
        camera.targetOffset = new THREE.Vector3(x, y, z);

        camera.threeCamera.zoom = 2;
        camera.threeCamera.updateProjectionMatrix();
    
    }



    //Creates the three types of cameras.
    var Alias_readMapProperties = Map.prototype.readMapProperties;
    Map.prototype.readMapProperties =  async function(){
        await Alias_readMapProperties.call(this);
        

        cameras["Perspective"] = this.camera;

        let sysCam = new SystemCameraProperties(null);
        
        ///Sets these properties for orthographic camera.
        sysCam.distance = this.camera.distance;
        sysCam.horizontalAngle = this.camera.horizontalAngle;
        sysCam.verticalAngle = this.camera.verticalAngle;
        sysCam.targetOffsetX = 0
        sysCam.targetOffsetY = 0
        sysCam.targetOffsetZ = 0
        sysCam.isSquareTargetOffsetX = 0
        sysCam.isSquareTargetOffsetY = 0
        sysCam.isSquareTargetOffsetZ = 0
        sysCam.fov = "2D" //Can be any value as will be completely ignore by ThreeJS.
        sysCam.near = 0
        sysCam.far = 0



        cameras["Orthographic"] = new Camera(sysCam, RPM
            .game.hero);

        //Create a copy of the scene's camera.
        cameras["Original"] = await this.UKL_GetNewCamera();
    }




    //--------------------------------
    // Handles rotating all face sprites to proper view.
    //--------------------------------

    MapPortion.prototype.updateFaceSprites2D =  function(angle){ //Is it 2D?
        let i, l
        for (i = 0, l = this.faceSpritesList.length; i < l; i++)
        {
            if(this.faceSpritesList[i])
                this.faceSpritesList[i].rotation.x = angle;
            
        }
        for (i = 0, l = this.objectsList.length; i < l; i++)
        {

            if(this.objectsList[i]){
                this.objectsList[i].update(angle);
                this.objectsList[i].changeState();
                this.objectsList[i].move(0,0,0,0);
            }



        }
    }

    MapObject.prototype.updateRot2DCam = function(angle){
        this.mesh.rotation.x = angle;
    }

    //This will be replaced when the reset camera feature is officially implemented.
    Map.prototype.UKL_GetNewCamera = async function(){

        this.mapProperties = new MapProperties();
        let json = await RPM.parseFileJSON(RPM.FILE_MAPS + this.mapName + RPM
            .FILE_MAP_INFOS);
        this.mapProperties.read(json);

        let cam = new Camera(this.mapProperties.cameraProperties, RPM
            .game.hero);

        return cam;
    }

    var Alias_CameraUpdateAngles = Camera.prototype.updateAngles;
    Camera.prototype.updateAngles = function(angle){
        if(this.threeCamera.fov)
            Alias_CameraUpdateAngles.call(this,angle);
        else{
            this.horizontalAngle = 270;
            this.verticalAngle = 0;
        }
    }
    */
})();

RPM.Manager.Plugins.registerCommand(pluginName, "TransitionTo2D", () => {
    console.log(Scene.Map.current);
    //Scene.Map.current.TransitionTo2D();
});