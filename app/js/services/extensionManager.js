class ExtensionManager {

  constructor($timeout) {
    this.messageQueue = [];
    this.timeout = $timeout;

    window.addEventListener("message", function(event){
      console.log("nested tags: message received", event.data);
      this.handleMessage(event.data);
    }.bind(this), false);

    this.postMessage("ready", null, function(data){

    });
  }

  handleMessage(payload) {
    if(payload.original) {
      // get callback from queue
      var originalMessage = this.messageQueue.filter(function(message){
        return message.id === payload.original.id;
      })[0];

      if(originalMessage.callback) {
        originalMessage.callback(payload.data);
      }
    }
  }

  postMessage(action, data, callback) {
    var message = {
      action: action,
      data: data,
      id: this.generateUUID(),
      api: "component"
    }

    var queueMessage = JSON.parse(JSON.stringify(message));
    queueMessage.callback = callback;
    this.messageQueue.push(queueMessage);

    window.parent.postMessage(message, '*');
  }

  streamItems(callback) {
    this.postMessage("stream-items", {content_types: ["Tag"]}, function(data){
      // console.log("Get items completion", data);
      var tags = data.items["Tag"];
      this.timeout(function(){
        callback(tags);
      })
    }.bind(this));
  }

  selectItem(item) {
    this.postMessage("select-item", item);
  }

  clearSelection() {
    this.postMessage("clear-selection", {content_type: "Tag"});
  }


  saveItem(item) {
    this.saveItems[item];
  }

  saveItems(items) {
    this.postMessage("save-items", {items: items}, function(data){
      // console.log("Successfully saved items");
    });
  }

  generateUUID() {
    var crypto = window.crypto || window.msCrypto;
    if(crypto) {
      var buf = new Uint32Array(4);
      crypto.getRandomValues(buf);
      var idx = -1;
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          idx++;
          var r = (buf[idx>>3] >> ((idx%8)*4))&15;
          var v = c == 'x' ? r : (r&0x3|0x8);
          return v.toString(16);
      });
    } else {
      var d = new Date().getTime();
      if(window.performance && typeof window.performance.now === "function"){
        d += performance.now(); //use high-precision timer if available
      }
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
      });
      return uuid;
    }
  }

}

angular.module('app').service('extensionManager', ExtensionManager);
