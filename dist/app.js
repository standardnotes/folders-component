'use strict';

angular.module('app', [

])
;class HomeCtrl {
  constructor($rootScope, $scope, $timeout) {

    var permissions = [
      {
        name: "stream-items",
        content_types: ["Tag", 'Note']
      }
    ]
    let componentManager = new window.ComponentManager(permissions, function(){
      // on ready
    });

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

      componentManager.saveItems(needsSave);
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
      componentManager.createItem(tag);
    }

    $scope.selectTag = function(tag) {
      if(tag.master) {
        componentManager.clearSelection();
      } else {
        componentManager.selectItem(tag);
      }

      if($scope.selectedTag) {
        $scope.selectedTag.selected = false;
      }

      if($scope.selectedTag === tag) {
        // edit
        tag.editing = true;
      }
      $scope.selectedTag = tag;
      tag.selected = true;
    }

    $scope.saveTags = function(tags) {
      componentManager.saveItems(tags);
    }

    componentManager.streamItems(function(newTags) {
      $timeout(function(){
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
      })
    }.bind(this));

    $scope.onTrashDrop = function(tagId) {
      var tag = $scope.masterTag.rawTags.filter(function(tag){return tag.uuid === tagId})[0];
      var deleteChain = [];

      function addChildren(tag) {
        deleteChain.push(tag);
        for(var child of tag.children) {
          addChildren(child);
        }
      }

      addChildren(tag);

      console.log("Trash drop", deleteChain);
      componentManager.deleteItems(deleteChain);
    }
  }

}

// required for firefox
HomeCtrl.$$ngIsClass = true;

angular.module('app').controller('HomeCtrl', HomeCtrl);
;angular
  .module('app')
  .directive('mbAutofocus', ['$timeout', function($timeout) {
    return {
      restrict: 'A',
      scope: {
        shouldFocus: "="
      },
      link : function($scope, $element) {
        $timeout(function() {
          if($scope.shouldFocus) {
            $element[0].focus();
          }
        });
      }
    }
  }]);
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
      createTag: "&",
      saveTags: "&"
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

    $scope.saveTagRename = function(tag) {
      var delimiter = ".";
      var tags = [tag];
      var title;
      if(tag.parent.master) {
        title = tag.displayTitle;
      } else {
        title = tag.parent.content.title + delimiter + tag.displayTitle;
      }

      tag.content.title = title;

      function renameChildren(tag) {
        for(var child of tag.children) {
          child.content.title = child.parent.content.title + delimiter + child.displayTitle;
          tags.push(child);
          renameChildren(child);
        }
      }

      renameChildren(tag);

      tag.editing = false;

      $scope.saveTags()(tags);
    }

    $scope.generationForTag = function(tag) {
      var generation = 0;
      var parent = tag.parent;
      while(parent) {
        generation++;
        parent = parent.parent;
      }
      return generation;
    }

  }
}

TagTree.$$ngIsClass = true;

angular.module('app').directive('tagTree', () => new TagTree);
