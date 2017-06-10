'use strict';

angular.module('app', [

])
;class HomeCtrl {
  constructor($rootScope, $scope, $timeout, extensionManager) {

    let delimiter = ".";

    $scope.resolveRawTags = function() {
      var resolved = $scope.masterTag.rawTags.slice();

      var findResolvedTag = function(title) {
        for(var tag of $scope.masterTag.rawTags) {
          if(tag.content.title === title) {
            return tag;
          }
        }
        return null;
      }

      for(var tag of $scope.masterTag.rawTags) {
        tag.children = [];
        tag.parent = null;
      };

      for(var tag of $scope.masterTag.rawTags) {
        var name = tag.content.title;
        var comps = name.split(delimiter);
        tag.displayTitle = comps[comps.length -1];
        if(comps.length == 1) {
          tag.parent = $scope.masterTag;
          continue;
        }

        var parentTitle = comps.slice(0, comps.length - 1).join(delimiter);
        var parent = findResolvedTag(parentTitle);
        if(!parent) {
          console.log("Parent not found for", parentTitle);
          continue;
        }

        parent.children.push(tag);
        parent.children = parent.children.sort(function(a, b){return a.content.title > b.content.title});
        tag.parent = parent;

        // remove chid from master list
        var index = resolved.indexOf(tag);
        resolved.splice(index, 1);
      }

      resolved = resolved.sort(function(a, b){return a.content.title > b.content.title});
      $scope.masterTag.children = resolved;
    }

    $scope.changeParent = function(sourceId, targetId) {
      var source = $scope.masterTag.rawTags.filter(function(tag){
        return tag.uuid === sourceId;
      })[0];

      var target = targetId === "0" ? $scope.masterTag : $scope.masterTag.rawTags.filter(function(tag){
        return tag.uuid === targetId;
      })[0];

      if(target.parent === source) {
        return;
      }

      var needsSave = [source];

      var adjustChildren = function(source) {
        for(var child of source.children) {
          var newTitle = source.content.title + delimiter + child.content.title.split(delimiter).slice(-1)[0];
          child.content.title = newTitle;
          needsSave.push(child);
          adjustChildren(child);
        }
      }

      var newTitle;
      if(target.master) {
        newTitle = source.content.title.split(delimiter).slice(-1)[0];
      } else {
        newTitle = target.content.title + delimiter + source.content.title.split(delimiter).slice(-1)[0];
      }
      source.content.title = newTitle;
      adjustChildren(source);


      $scope.resolveRawTags();

      extensionManager.saveItems(needsSave);
    }

    $scope.createTag = function(tag) {
      tag.content_type = "Tag";
      var title;
      if(tag.parent.master) {
        title = tag.content.title;
      } else {
        title = tag.parent.content.title + delimiter + tag.content.title;
      }
      tag.content.title = title;
      tag.dummy = false;
      extensionManager.createItem(tag);
    }

    $scope.selectTag = function(tag) {
      if(tag.master) {
        extensionManager.clearSelection();
      } else {
        extensionManager.selectItem(tag);
      }
      if($scope.selectedTag) {
        $scope.selectedTag.selected = false;
      }
      $scope.selectedTag = tag;
      tag.selected = true;
    }

    extensionManager.streamItems(function(newTags) {
      console.log("New stream data:", newTags);

      var allTags = $scope.masterTag ? $scope.masterTag.rawTags : [];
      for(var tag of newTags) {
        var existing = allTags.filter(function(tagCandidate){
          return tagCandidate.uuid === tag.uuid;
        })[0];
        if(existing) {
          Object.assign(existing, tag);
        } else {
          allTags.push(tag);
        }
      }

      $scope.masterTag = {
        master: true,
        content: {
          title: ""
        },
        displayTitle: "All",
        rawTags: allTags,
        uuid: "0"
      }

      $scope.resolveRawTags();
    }.bind(this));

    $scope.onTrashDrop = function(tagId) {
      var tag = $scope.masterTag.rawTags.filter(function(tag){return tag.uuid === tagId})[0];
      extensionManager.deleteItem(tag);
      console.log("Trash drop", tag);
    }

  }

}

// required for firefox
HomeCtrl.$$ngIsClass = true;

angular.module('app').controller('HomeCtrl', HomeCtrl);
;angular
  .module('app')
  .directive('draggable', function() {
  return  {
    scope: {
      tagId: "=",
      drop: '&',
      isDraggable: "="
    },
    link: function(scope, element, attrs) {
      // 'ngInject';
      var el = element[0];

      el.draggable = scope.isDraggable;

      var counter = 0;

      el.addEventListener(
        'dragstart',
        function(e) {
          counter = 0;
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('TagId', JSON.stringify(scope.tagId));
          this.classList.add('drag');
          return false;
        },
        false
      );

      el.addEventListener(
        'dragend',
        function(e) {
          this.classList.remove('drag');
          this.classList.remove('over');
          return false;
        },
        false
      );

      el.addEventListener(
        'dragover',
        function(e) {
          e.dataTransfer.dropEffect = 'move';
          // allows us to drop
          if (e.preventDefault) e.preventDefault();
          this.classList.add('over');
          return false;
        },
        false
      );

      el.addEventListener(
        'dragenter',
        function(e) {
          counter++;
          this.classList.add('over');
          return false;
        },
        false
      );

      el.addEventListener(
        'dragleave',
        function(e) {
          counter--;
           if (counter === 0) {
             this.classList.remove('over');
           }
          return false;
        },
        false
      );

      el.addEventListener(
        'dragexit',
        function(e) {
          // counter--;
          //  if (counter === 0) {
             this.classList.remove('over');
          //  }
          return false;
        },
        false
      );

      el.addEventListener(
        'drop',
        function(e) {
          // Stops some browsers from redirecting.
          counter = 0;
          if (e.stopPropagation) e.stopPropagation();

          this.classList.remove('over');

          var targetId = JSON.parse(e.dataTransfer.getData('TagId'));
          if(targetId === scope.tagId) {
            return;
          }
          scope.$apply(function(scope) {
            scope.drop()(targetId, scope.tagId);
          });

          return false;
        },
        false
      );

    }
  }
});
;class TagTree {

  constructor() {
    this.restrict = "C";
    this.templateUrl = "directives/tag_tree.html";
    this.scope = {
      tag: "=",
      changeParent: "&",
      onSelect: "&",
      createTag: "&"
    };
  }

  controller($scope) {
    'ngInject';

    $scope.onDrop = function(sourceId, targetId) {
      $scope.changeParent()(sourceId, targetId);
    }

    $scope.onDragOver = function(event) {
      // console.log("onDragOver", event);
    }

    $scope.onDragStart = function(event) {
      // console.log("On drag start", event);
    }

    $scope.selectTag = function() {
      $scope.onSelect()($scope.tag);
    }

    $scope.addChild = function(parent) {
      parent.children.unshift({dummy: true, parent: parent, content: {}})
    }

    $scope.saveNewTag = function(tag) {
      if(tag.content.title.length === 0) {
        tag.parent.children.slice(tag.parent.children.indexOf(tag), 0);
        return;
      }
      $scope.createTag()(tag);
    }

    $scope.circleClassForTag = function(tag) {
      var generation = 0;
      var parent = tag.parent;
      while(parent) {
        generation++;
        parent = parent.parent;
      }

      return "level-" + generation;
    }

  }
}

TagTree.$$ngIsClass = true;

angular.module('app').directive('tagTree', () => new TagTree);
;class ExtensionManager {

  constructor($timeout) {
    this.sentMessages = [];
    this.messageQueue = [];
    this.timeout = $timeout;

    window.addEventListener("message", function(event){
      // console.log("nested tags: message received", event.data);
      this.handleMessage(event.data);
    }.bind(this), false);
  }

  handleMessage(payload) {
    if(payload.action === "component-registered") {
      this.sessionKey = payload.sessionKey;
      this.onReady();
    }

    else if(payload.original) {
      // get callback from queue
      var originalMessage = this.sentMessages.filter(function(message){
        return message.messageId === payload.original.messageId;
      })[0];

      if(originalMessage.callback) {
        originalMessage.callback(payload.data);
      }
    }
  }

  onReady() {
    for(var message of this.messageQueue) {
      this.postMessage(message.action, message.data, message.callback);
    }
    this.messageQueue = [];
  }

  postMessage(action, data, callback) {
    if(!this.sessionKey) {
      this.messageQueue.push({
        action: action,
        data: data,
        callback: callback
      });
      return;
    }

    var message = {
      action: action,
      data: data,
      messageId: this.generateUUID(),
      sessionKey: this.sessionKey,
      api: "component"
    }

    var sentMessage = JSON.parse(JSON.stringify(message));
    sentMessage.callback = callback;
    this.sentMessages.push(sentMessage);

    window.parent.postMessage(message, '*');
  }

  streamItems(callback) {
    this.postMessage("stream-items", {content_types: ["Tag"]}, function(data){
      var tags = data.items;
      this.timeout(function(){
        callback(tags);
      })
    }.bind(this));
  }

  createItem(item) {
    this.postMessage("create-item", {item: this.jsonObjectForItem(item)});
  }

  selectItem(item) {
    this.postMessage("select-item", {item: this.jsonObjectForItem(item)});
  }

  deleteItem(item) {
    this.postMessage("delete-item", {item: this.jsonObjectForItem(item)});
  }

  clearSelection() {
    this.postMessage("clear-selection", {content_type: "Tag"});
  }

  saveItem(item) {
    this.saveItems[item];
  }

  saveItems(items) {
    items = items.map(function(item) {
      return this.jsonObjectForItem(item);
    }.bind(this));

    this.postMessage("save-items", {items: items}, function(data){
      // console.log("Successfully saved items");
    });
  }

  jsonObjectForItem(item) {
    var copy = Object.assign({}, item);
    copy.children = null;
    copy.parent = null;
    return copy;
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

ExtensionManager.$$ngIsClass = true;

angular.module('app').service('extensionManager', ExtensionManager);
