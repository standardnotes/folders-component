class HomeCtrl {
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

      if($scope.selectedTag === tag && !tag.master) {
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

      componentManager.deleteItems(deleteChain);
    }
  }

}

// required for firefox
HomeCtrl.$$ngIsClass = true;

angular.module('app').controller('HomeCtrl', HomeCtrl);
