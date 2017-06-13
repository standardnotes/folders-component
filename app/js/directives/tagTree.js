class TagTree {

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
