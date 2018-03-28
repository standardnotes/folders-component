class TagTree {

  constructor() {
    this.restrict = "C";
    this.templateUrl = "directives/tag_tree.html";
    this.scope = {
      tag: "=",
      changeParent: "&",
      onSelect: "&",
      createTag: "&",
      saveTags: "&",
      deleteTag: "&"
    };
  }

  controller($scope, $timeout) {
    'ngInject';

    $scope.onDrop = function(sourceId, targetId) {
      $scope.changeParent()(sourceId, targetId);
    }

    $scope.onDragOver = function(event) {

    }

    $scope.onDragStart = function(event) {

    }

    $scope.selectTag = function() {
      $scope.onSelect()($scope.tag);
    }

    $scope.addChild = function(parent) {
      var addTag = () => {
        $scope.addingTag = {parentScope: $scope, dummy: true, parent: parent, content: {title: ""}};
        parent.children.unshift($scope.addingTag);
      }

      if($scope.addingTag) {
        if($scope.addingTag.content.title.length == 0) {
          return;
        }

        $scope.saveNewTag($scope.addingTag);
        $timeout(addTag, 100);
      } else {
        addTag();
      }
    }

    $scope.saveNewTag = function(tag) {
      tag.parentScope.addingTag = null;
      if(!tag.content.title || tag.content.title.length === 0) {
        tag.parent.children.slice(tag.parent.children.indexOf(tag), 0);
        return;
      }
      tag.parentScope = null; // avoid json circular refs
      $scope.createTag()(tag);
    }

    $scope.removeTag = function(tag) {
      $scope.deleteTag()(tag);
    }

    $scope.saveTagRename = function(tag) {
      if(!tag.displayTitle || tag.displayTitle.length == 0) {
        // Delete
        $scope.deleteTag()(tag);
        return;
      }
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

    $scope.circleClassForTag = function(tag) {
      let gen = $scope.generationForTag(tag);
      var circleClass = {
        0: "info",
        1: "info",
        2: "success",
        3: "danger",
        4: "warning"
      }[gen];

      return circleClass ? circleClass : "default";
    }

  }
}

TagTree.$$ngIsClass = true;

angular.module('app').directive('tagTree', () => new TagTree);
