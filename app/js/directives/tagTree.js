class TagTree {

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
