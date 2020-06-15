(function(win){
  var parentWin = win.parent;
  var utils = win.RongWhite.utils;
  var whiteWebSdk = new WhiteWebSdk();
  var hereWhiteConfig = {
    URL: 'https://cloudcapiv4.herewhite.com/room?token=',
    miniToken: 'WHITEcGFydG5lcl9pZD02dFBKT1lzMG52MHFoQzN2Z1BRUXVmN0t0RnVOVGl0bzBhRFAmc2lnPTMyZTRiNTMwNjkyN2RhN2I3NzI4MjMwOTJlZTNmNDJhNWI3MGMyMjU6YWRtaW5JZD0yMTEmcm9sZT1taW5pJmV4cGlyZV90aW1lPTE1ODkzNzY1MjEmYWs9NnRQSk9ZczBudjBxaEMzdmdQUVF1ZjdLdEZ1TlRpdG8wYURQJmNyZWF0ZV90aW1lPTE1NTc4MTk1Njkmbm9uY2U9MTU1NzgxOTU2OTQyNTAw'
  }

  var whiteEvent = new utils.EventEmitter();
  var Room,whiteRoomInfo={};
  var url = hereWhiteConfig.URL + hereWhiteConfig.miniToken;
  var requestInit = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      name: '融云 White Board 房间',
      limit: 100, // 房间人数限制
      mode: 'transitory'
    }),
  };

  var toolsBoxDom = document.getElementById('toolsBox');
  var wordDom = document.getElementById('toolsWord');
  var eraserDom = document.getElementById('toolsEraser');
  var pencilDom = document.getElementById('toolsPencil');
  var clearDom = document.getElementById('toolsClear');
  var newSceneDom = document.getElementById('toolsNewScene');
  var deleteDom = document.getElementById('toolsDelete')
  var pencilColorDom = document.getElementById('pencilColor');
  var colorBoxes = pencilColorDom.getElementsByTagName('span');
  var preSceneDom = document.getElementById('preScene');
  var nextSceneDom = document.getElementById('nextScene');
  var uploadDom = document.getElementById('uploadFile');
  var whiteEnum = {
    wbFolderName: '/rtc',
    sceneNamePrefix: 'rongRTCWB'
  }
  var callbacks = {
    onPhaseChanged: function(phase) {
      // 白板发生状态改变, 具体状态如下:
      // "connecting",
      // "connected",
      // "reconnecting",
      // "disconnecting",
      // "disconnected",
      console.log(phase);
    },
    onRoomStateChanged: function(modifyState) {
      if (modifyState.globalState) {
        // globalState 改变了
        var newGlobalState = modifyState.globalState;
        console.log('newGlobalState: ', newGlobalState);
      }
      if (modifyState.memberState) {
        // memberState 改变了
        var newMemberState = modifyState.memberState;
        console.log('newMemberState: ', newMemberState);
      }
      if (modifyState.sceneState) {
        // sceneState 改变了
        var newSceneState = modifyState.sceneState;
        console.log('newSceneState: ', newSceneState);
      }
      if (modifyState.broadcastState) {
        // broadcastState 改变了
        var broadcastState = modifyState.broadcastState;
        console.log('broadcastState: ', broadcastState);
      }
    },
    onDisconnectWithError: function (error) {
      // 出现连接失败后的具体错误
      console.log(error);
    },
  };
  function leaveWBRoom() {
    Room.disconnect();
  }
  function getWhite(isNewWhite, roomInfo, callback, isBystander) {
    if(isNewWhite){
      fetch(url, requestInit).then(function(response) {
        return response.json();
      }).then(function(json) {
        whiteRoomInfo.uuid = json.msg.room.uuid;
        whiteRoomInfo.roomToken = json.msg.roomToken;
        console.log(json.msg);
        return whiteWebSdk.joinRoom({
          uuid: json.msg.room.uuid,
          roomToken: json.msg.roomToken,
        },callbacks);
      }).then(function(room) {
        room.bindHtmlElement(document.getElementById('whiteboard'));
        var folderName = whiteEnum.wbFolderName;
        Room = room;
        win.RongWhite.whiteRoom = Room;
        callback();
        var sceneName = createSceneName();
        switchNewScene(folderName, sceneName);
        Room.setMemberState({
          strokeColor: [255,0,0]
        });
      });
    }else {
      whiteWebSdk.joinRoom({
        uuid: roomInfo.uuid,
        roomToken: roomInfo.roomToken
      }).then(function(room){
        room.bindHtmlElement(document.getElementById('whiteboard'));
        Room = room;
        win.RongWhite.whiteRoom = Room;
        if(isBystander){
          room.disableOperations = true;
          toolsBoxDom.style.display = 'none';
          preSceneDom.style.display = 'none';
          nextSceneDom.style.display = 'none';
          room.setMemberState({
            currentApplianceName: 'selector'
          });
          return ;
        }
        Room.setMemberState({
          strokeColor: [255,0,0]
        });
      });
    }
  }
  function join(params) {
    return new Promise(function(reslove, reject) {
      whiteWebSdk.joinRoom({
        uuid: params.uuid,
        roomToken: params.roomToken
      }).then(function(room){
        room.bindHtmlElement(document.getElementById('whiteboard'));
        whiteRoomInfo.uuid = params.uuid;
        whiteRoomInfo.roomToken = params.roomToken;
        Room = room;
        win.RongWhite.whiteRoom = Room;
        var currentPath = Room.state.sceneState.scenePath
        if(currentPath == '/init'){
          var sceneName = createSceneName();
          switchNewScene(whiteEnum.wbFolderName, sceneName);
        }else {
          Room.setScenePath(Room.state.sceneState.scenePath)
        }
        if(!params.isStu){Room.setViewMode('broadcaster')}
        if(params.isStu){
          room.disableOperations = true;
          toolsBoxDom.style.display = 'none';
          preSceneDom.style.display = 'none';
          nextSceneDom.style.display = 'none';
          room.setMemberState({
            currentApplianceName: 'selector'
          });
        }
        Room.setMemberState({
          strokeColor: [255,0,0]
        });
        reslove();
      }).catch(function(err) {
        reject(err)
      })
    })
  }
  pencilDom.onclick = function(e) {
    e.preventDefault();
    var isShow = pencilColorDom.style.display;
    if(isShow === 'block'){
      pencilColorDom.style.display = 'none';
      return;
    }
    pencilColorDom.style.display = 'block';
    Room.setMemberState({
      currentApplianceName: 'pencil'
    });
  }
  wordDom.onclick = function() {
    Room.setMemberState({
      currentApplianceName: 'text'
    });
  }
  eraserDom.onclick = function() {
    Room.setMemberState({
      currentApplianceName: 'eraser'
    });
  }
  clearDom.onclick = function() {
    Room.cleanCurrentScene();
  }
  newSceneDom.onclick = function() {
    var path = whiteEnum.wbFolderName;
    var sceneName = createSceneName();
    Room.putScenes(path,[{name: sceneName.toString()}]);
    var setCurrentPath = path + '/' + sceneName;
    Room.setScenePath(setCurrentPath);
  }
  deleteDom.onclick = function() {
    var scenes = Room.state.sceneState.scenes;
    if(scenes.length == 1){
      whiteEvent.emit('room-destroy');
      return;
    }
    var delPath = Room.state.sceneState.scenePath;
    Room.removeScenes(delPath);
  }
  preSceneDom.onclick = function() {
    console.log(Room.state.sceneState.scenePath);
    var sceneState = Room.state.sceneState;
    var firstSceneName = sceneState.scenes[0].name;
    var currentSceneName = sceneState.scenePath.split('/')[2];
    if(firstSceneName == currentSceneName){
      return;
    }
    sceneState.scenes.forEach(function(item,index) {
      if(currentSceneName == item.name){
        var preSceneName = sceneState.scenes[index-1].name;
        console.log(index,item,preSceneName);
        Room.setScenePath(whiteEnum.wbFolderName+'/'+preSceneName);
      }
    });
  }
  nextSceneDom.onclick = function() {
    var sceneState = Room.state.sceneState;
    var lastSceneName = sceneState.scenes[sceneState.scenes.length-1].name;
    var currentSceneName = sceneState.scenePath.split('/')[2];
    if(lastSceneName == currentSceneName){
      return;
    }
    sceneState.scenes.forEach(function(item,index) {
      if(currentSceneName == item.name){
        var preSceneName = sceneState.scenes[index+1].name;
        console.log(index,item,preSceneName);
        Room.setScenePath(whiteEnum.wbFolderName+'/'+preSceneName);
      }
    });
  }
  var convert = function(pptUrl) {
    var pptConverter = whiteWebSdk.pptConverter(whiteRoomInfo.roomToken);
    pptConverter.convert({
      url: pptUrl,
      kind: 'static',
      onProgressUpdated: progress => {
        console.log(progress)
      },
      checkProgressInterval: 1500,
      checkProgressTimeout: 5 * 60 * 1000,
    }).then( res => {
      console.log(res);
      var path = whiteEnum.wbFolderName;
      var time = new Date().getTime();
      res.scenes.forEach(item => {
        item.name = whiteEnum.sceneNamePrefix + time++;
      })
      Room.putScenes(path, res.scenes);
      Room.setScenePath(`${whiteEnum.wbFolderName}/${res.scenes[0].name}`);
      whiteEvent.emit('room-upload-end', {
        status: 'success'
      })
    }).catch( err => {
      whiteEvent.emit('room-upload-error')
      console.log(err)
    })
  }

  var putImage = function(imageUrl) {
    var uuid = whiteRoomInfo.uuid;
    var img = new Image()
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    img.onload = function(){
      Room.insertImage({
        uuid: uuid, 
        centerX: 0, 
        centerY: 0, 
        width: img.width, 
        height: img.height
      });
      Room.completeImageUpload(uuid, imageUrl);
      whiteEvent.emit('room-upload-end', {
        status: 'success'
      })
    }
  }

  uploadDom.onchange = function(event) {
    whiteEvent.emit('room-upload-start')
    var _file = this.files[0];
    if(utils.isIllegalFileType(_file.type)) {
      return  whiteEvent.emit('room-upload-error', 'fileType')
    }
    var fileType = _file.name.split('.')[1];
    var isImage = utils.isImageFile(fileType);
    var handleFunc = isImage ? putImage : convert ;
    var handleUploadFunc = isImage ? utils.uploadImage :  utils.uploadFile ;
    var callbacks = {
      onComplete: function(data) {
        console.log(data)
        event.target.value = '';// 防止重复上传同一文件， onchange 无法触发
        handleFunc(data.downloadUrl)
      },
      onError: function(err) {
        console.log(err)
        whiteEvent.emit('room-upload-error')
      }
    }
    handleUploadFunc(_file, callbacks)
  }
  function createSceneName() {
    return whiteEnum.sceneNamePrefix + new Date().getTime();
  }
  function setPencilColor(rgb) {
    Room.setMemberState({
      strokeColor: rgb
    });
  }
  function setBoxesColor() {
    for(var i=0;i<colorBoxes.length;i++){
      (function(i){
        colorBoxes[i].onclick = function(e) {
          var color = e.target.className;
          e.stopPropagation();
          pencilColorDom.style.display = 'none';
          switch (color) {
          case 'color-red' :
            return setPencilColor([255,0,0]);
          case 'color-orange' :
            return setPencilColor([255,165,0]);
          case 'color-yellow' :
            return setPencilColor([255,255,0]);
          case 'color-blue' :
            return setPencilColor([0,0,255])
          case 'color-cyan' :
            return setPencilColor([0,255,255])
          case 'color-green' :
            return setPencilColor([0,128,0])
          case 'color-black' :
            return setPencilColor([0,0,0])
          case 'color-purple' :
            return setPencilColor([128,0,128])
          case 'color-gray' :
            return setPencilColor([128,128,128])
          }
        }
      })(i)
    }
  }
  
  setBoxesColor();

  function switchNewScene(folderName,sceneName) {
    Room.putScenes(folderName,[{name: sceneName}]);
    Room.setScenePath(folderName+'/'+sceneName);
  }

  win.onresize = function(){
    if(Room){
      Room.refreshViewSize();
    }
  }

  var white = {
    join: join,
    getWhite: getWhite,
    whiteWebSdk: whiteWebSdk,
    whiteRoomInfo: whiteRoomInfo,
    leaveWBRoom: leaveWBRoom,
    whiteEvent: whiteEvent
  };

  win.RongWhite.white = white;
  
  console.log('white',win.RongWhite)
})(window)
