class HomeCtrl {
  constructor($rootScope, $scope, $timeout) {

    let smartTagContentType = "SN|SmartTag";

    let componentManager = new window.ComponentManager([], function(){
      // on ready
    });

    let delimiter = ".";

    $scope.resolveRawTags = function(masterTag) {
      let sortTags = (tags) => {
        return tags.sort((a, b) => (a.content.title > b.content.title) - (a.content.title < b.content.title));
      }
      var resolved = masterTag.rawTags.slice();

      var findResolvedTag = function(title) {
        for(var tag of masterTag.rawTags) {
          if(tag.content.title === title) {
            return tag;
          }
        }
        return null;
      }

      for(var tag of masterTag.rawTags) {
        var pendingDummy = tag.children && tag.children.find((c) => {return c.dummy});
        tag.children = [];
        tag.parent = null;

        if(pendingDummy) {
          tag.children.unshift(pendingDummy);
        }
      };

      for(var tag of masterTag.rawTags) {
        var name = tag.content.title;
        var comps = name.split(delimiter);
        tag.displayTitle = comps[comps.length -1];
        if(comps.length == 1) {
          tag.parent = masterTag;
          continue;
        }

        var parentTitle = comps.slice(0, comps.length - 1).join(delimiter);
        var parent = findResolvedTag(parentTitle);
        if(!parent) {
          continue;
        }

        parent.children.push(tag);
        parent.children = sortTags(parent.children);
        tag.parent = parent;

        // remove chid from master list
        var index = resolved.indexOf(tag);
        resolved.splice(index, 1);

        if($scope.selectedTag && $scope.selectedTag.uuid == tag.uuid) {
          $scope.selectedTag = tag;
          tag.selected = true;
        }
      }

      var pendingDummy = masterTag.children && masterTag.children.find((c) => {return c.dummy});
      masterTag.children = sortTags(resolved);
      if(pendingDummy) { masterTag.children.unshift(pendingDummy); }
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
      $scope.resolveRawTags($scope.masterTag);

      componentManager.saveItems(needsSave);
    }

    $scope.createTag = function(tag) {
      var title = tag.content.title;
      if(title.startsWith("!")) {
        // Create smart tag
        /*
        !["Tagless", "tags.length", "=", 0]
        !["B-tags", "tags", "includes", ["title", "startsWith", "b"]]
        !["Foo Notes", "title", "startsWith", "Foo"]
        !["Archived", "archived", "=", true]
        !["Pinned", "pinned", "=", true]
        !["Recently Edited", "updated_at", ">", "1.hours.ago"]
        !["Long", "text.length", ">", 500]
        */
        console.log("Parsing json", title.substring(1, title.length));
        var components = JSON.parse(title.substring(1, title.length));
        var smartTag = {
          content_type: smartTagContentType,
          content: {
            title: components[0],
            predicate: {
              keypath: components[1],
              operator: components[2],
              value: components[3]
            }
          }
        }
        componentManager.createItem(smartTag, (createdTag) => {
          $timeout(() => {
            $scope.selectTag(createdTag);
          })
        });
      } else {
        tag.content_type = "Tag";
        var title;
        if(tag.parent.master) {
          title = tag.content.title;
        } else {
          title = tag.parent.content.title + delimiter + tag.content.title;
        }
        tag.content.title = title;
        tag.dummy = false;
        componentManager.createItem(tag, (createdTag) => {
          $timeout(() => {
            $scope.selectTag(createdTag);
          });
        });
      }
    }

    $scope.selectTag = function(tag) {
      if(tag.smartMaster) {
        // do nothing, but continue to other steps
      } else if(tag.master) {
        componentManager.clearSelection();
      } else {
        componentManager.selectItem(tag);
      }

      if($scope.selectedTag && $scope.selectedTag != tag) {
        $scope.selectedTag.selected = false;
        $scope.selectedTag.editing = false;
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

    componentManager.streamItems(["Tag", smartTagContentType], (newTags) => {
      $timeout(function(){
        var allTags = $scope.masterTag ? $scope.masterTag.rawTags : [];
        var smartTags = $scope.smartMasterTag ? $scope.smartMasterTag.rawTags : [];
        for(var tag of newTags) {
          var isSmartTag = tag.content_type == smartTagContentType;
          var arrayToUse = isSmartTag ? smartTags : allTags;

          var existing = arrayToUse.filter(function(tagCandidate){
            return tagCandidate.uuid === tag.uuid;
          })[0];

          if(existing) {
            Object.assign(existing, tag);
          } else if(tag.content.title) {
            arrayToUse.push(tag);
          }

          if(tag.deleted) {
            var index = arrayToUse.indexOf(existing || tag);
            arrayToUse.splice(index, 1);
          } else {
            if(existing && $scope.selectedTag.uuid == existing.uuid) {
              // Don't call $scope.selectTag(existing) as this will double select a tag, which will enable editing for it.
              existing.selected = true;
            }
          }
        }

        if(!$scope.masterTag) {
          $scope.masterTag = {
            master: true,
            content: {
              title: ""
            },
            displayTitle: "All",
            uuid: "0"
          }
        }

        if(!$scope.smartMasterTag) {
          $scope.smartMasterTag = {
            master: true,
            smartMaster: true,
            content: {
              title: ""
            },
            displayTitle: "Views",
            uuid: "1"
          }
        }

        $scope.masterTag.rawTags = allTags;
        $scope.smartMasterTag.rawTags = smartTags;

        if(!$scope.selectedTag || ($scope.selectedTag && $scope.selectedTag.master)) {
          if($scope.selectedTag && $scope.selectedTag.smartMaster) {
            $scope.selectedTag = $scope.smartMasterTag;
            $scope.masterTag.selected = false;
          } else {
            $scope.selectedTag = $scope.masterTag;
            $scope.smartMasterTag.selected = false;
          }
          $scope.selectedTag.selected = true;
        }

        if($scope.selectedTag.deleted) {
          $scope.selectTag($scope.masterTag);
        }

        $scope.resolveRawTags($scope.masterTag);
        $scope.resolveRawTags($scope.smartMasterTag);
      })
    });

    $scope.deleteTag = function(tag) {
      var isSmartTag = tag.content_type == smartTagContentType;
      var arrayToUse = isSmartTag ? $scope.smartMasterTag.rawTags : $scope.masterTag.rawTags;

      var tag = arrayToUse.filter(function(tagCandidate){
        return tagCandidate.uuid === tag.uuid;
      })[0];

      var deleteChain = [];

      function addChildren(tag) {
        deleteChain.push(tag);
        if(tag.children) {
          for(var child of tag.children) {
            addChildren(child);
          }
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
