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
      };

      for(var tag of $scope.masterTag.rawTags) {
        var name = tag.content.title;
        var comps = name.split(delimiter);
        tag.displayTitle = comps[comps.length -1];
        if(comps.length == 1) {
          continue;
        }

        var parentTitle = comps.slice(0, comps.length - 1).join(delimiter);
        var parent = findResolvedTag(parentTitle);
        if(!parent) {
          console.log("Parent not found for", parentTitle);
          continue;
        }

        // console.log("Adding", tag.content.title, "to", parent.content.title);

        parent.children.push(tag);

        // remove chid from master list
        var index = resolved.indexOf(tag);
        resolved.splice(index, 1);
      }

      // console.log("Resolved:", resolved);

      $scope.masterTag.children = resolved;
    }

    $scope.changeParent = function(sourceId, targetId) {

      var source = $scope.masterTag.rawTags.filter(function(tag){
        return tag.uuid === sourceId;
      })[0];

      var target = targetId === "0" ? $scope.masterTag : $scope.masterTag.rawTags.filter(function(tag){
        return tag.uuid === targetId;
      })[0];

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

      console.log("All tags", allTags);

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
    }.bind(this))
  }

}

angular.module('app').controller('HomeCtrl', HomeCtrl);
;angular
  .module('app')
  .directive('draggable', function() {
  return  {
    scope: {
      tagId: "=",
      drop: '&',
    },
    link: function(scope, element, attrs) {
      // 'ngInject';
      // this gives us the native JS object
      var el = element[0];

      el.draggable = true;

      el.addEventListener(
        'dragstart',
        function(e) {
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

      var counter = 0;

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
        'drop',
        function(e) {
          // Stops some browsers from redirecting.
          if (e.stopPropagation) e.stopPropagation();

          this.classList.remove('over');

          var targetId = JSON.parse(e.dataTransfer.getData('TagId'));
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
      onSelect: "&"
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

  }

}

angular.module('app').directive('tagTree', () => new TagTree);
;class ExtensionManager {

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
