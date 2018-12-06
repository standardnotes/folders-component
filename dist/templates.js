angular.module('app').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('directives/tag_cell.html',
    "<li>\r" +
    "\n" +
    "<div class='self' draggable='true' drop='onDrop' ng-class='{&#39;selected&#39; : tag.selected}' ng-click='selectTag()' tag-id='tag.uuid'>\r" +
    "\n" +
    "{{tag.displayTitle}}\r" +
    "\n" +
    "</div>\r" +
    "\n" +
    "</li>\r" +
    "\n" +
    "<li ng-if='tag.children'>\r" +
    "\n" +
    "<ul>\r" +
    "\n" +
    "<div change-parent='changeParent()' class='tag-cell' ng-repeat='child in tag.children' on-select='onSelect()' tag='child'></div>\r" +
    "\n" +
    "</ul>\r" +
    "\n" +
    "</li>\r" +
    "\n"
  );


  $templateCache.put('directives/tag_tree.html',
    "<div ng-if='tag'>\r" +
    "\n" +
    "<div class='self' draggable='true' drop='onDrop' is-draggable='isDraggable()' is-droppable='isDroppable()' ng-class='{&#39;selected&#39; : tag.selected}' ng-click='selectTag($event)' tag-id='tag.uuid'>\r" +
    "\n" +
    "<div class='tag-info body-text-color' ng-class='&#39;level-&#39; + generationForTag(tag)'>\r" +
    "\n" +
    "<div class='circle small' ng-class='circleClassForTag(tag)' ng-click='innerCollapse(tag); $event.stopPropagation();'></div>\r" +
    "\n" +
    "<div class='title' ng-if='!tag.dummy &amp;&amp; !tag.editing'>\r" +
    "\n" +
    "{{tag.displayTitle}}\r" +
    "\n" +
    "</div>\r" +
    "\n" +
    "<input class='title' mb-autofocus='true' ng-if='!tag.dummy &amp;&amp; tag.editing' ng-keyup='$event.keyCode == 13 &amp;&amp; saveTagRename(tag)' ng-model='tag.displayTitle' should-focus='true'>\r" +
    "\n" +
    "<div class='action-menu' ng-if='!tag.dummy &amp;&amp; tag.selected &amp;&amp; !tag.editing'>\r" +
    "\n" +
    "<button class='half danger' ng-click='removeTag(tag); $event.stopPropagation();' ng-if='!tag.master'>–</button>\r" +
    "\n" +
    "<button ng-click='addChild($event, tag);'>+</button>\r" +
    "\n" +
    "</div>\r" +
    "\n" +
    "<div class='new-tag-form' ng-if='tag.dummy'>\r" +
    "\n" +
    "<input mb-autofocus='true' ng-blur='saveNewTag(tag)' ng-keyup='$event.keyCode == 13 &amp;&amp; saveNewTag(tag)' ng-model='tag.content.title' placeholder='' should-focus='true'>\r" +
    "\n" +
    "</div>\r" +
    "\n" +
    "</div>\r" +
    "\n" +
    "</div>\r" +
    "\n" +
    "<div ng-if='!tag.clientData.collapsed' ng-repeat='child in tag.children'>\r" +
    "\n" +
    "<div change-parent='changeParent()' class='tag-tree' create-tag='createTag()' delete-tag='deleteTag()' ng-if='!child.deleted' on-select='onSelect($event)' on-toggle-collapse='onToggleCollapse()' save-tags='saveTags()' tag='child'></div>\r" +
    "\n" +
    "</div>\r" +
    "\n" +
    "</div>\r" +
    "\n"
  );


  $templateCache.put('home.html',
    "<div class='sn-component'>\r" +
    "\n" +
    "<div class='content'>\r" +
    "\n" +
    "<div class='header'>\r" +
    "\n" +
    "<h4 class='body-text-color'>Folders</h4>\r" +
    "\n" +
    "</div>\r" +
    "\n" +
    "<div class='tag-tree master' create-tag='createTag' delete-tag='deleteTag' ng-if='smartMasterTag.rawTags.length &gt; 0' on-select='selectTag' on-toggle-collapse='toggleCollapse' save-tags='saveTags' tag='smartMasterTag'></div>\r" +
    "\n" +
    "<div change-parent='changeParent' class='tag-tree master' create-tag='createTag' delete-tag='deleteTag' on-select='selectTag' on-toggle-collapse='toggleCollapse' save-tags='saveTags' tag='masterTag'></div>\r" +
    "\n" +
    "</div>\r" +
    "\n" +
    "</div>\r" +
    "\n"
  );

}]);
