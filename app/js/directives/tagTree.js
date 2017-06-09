class TagTree {

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
