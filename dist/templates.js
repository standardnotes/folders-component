angular.module('app').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('directives/tag_cell.html',
    "<li>\n" +
    "<div class='self' draggable='true' drop='onDrop' ng-class='{&#39;selected&#39; : tag.selected}' ng-click='selectTag()' tag-id='tag.uuid'>\n" +
    "{{tag.displayTitle}}\n" +
    "</div>\n" +
    "</li>\n" +
    "<li ng-if='tag.children'>\n" +
    "<ul>\n" +
    "<div change-parent='changeParent()' class='tag-cell' ng-repeat='child in tag.children' on-select='onSelect()' tag='child'></div>\n" +
    "</ul>\n" +
    "</li>\n"
  );


  $templateCache.put('directives/tag_tree.html',
    "<div ng-if='tag'>\n" +
    "<div class='self' draggable='true' drop='onDrop' is-draggable='!tag.master' ng-class='{&#39;selected&#39; : tag.selected}' ng-click='selectTag()' tag-id='tag.uuid'>\n" +
    "<div class='tag-info body-text-color' ng-class='&#39;level-&#39; + generationForTag(tag)'>\n" +
    "<div class='circle small' ng-class='circleClassForTag(tag)'></div>\n" +
    "<div class='title' ng-if='!tag.dummy &amp;&amp; !tag.editing'>\n" +
    "{{tag.displayTitle}}\n" +
    "</div>\n" +
    "<input class='title' mb-autofocus='true' ng-if='!tag.dummy &amp;&amp; tag.editing' ng-keyup='$event.keyCode == 13 &amp;&amp; saveTagRename(tag)' ng-model='tag.displayTitle' should-focus='true'>\n" +
    "<div class='hover-menu' ng-if='!tag.dummy &amp;&amp; !tag.editing &amp;&amp; tag.selected'>\n" +
    "<button class='half danger' ng-click='removeTag(tag); $event.stopPropagation();' ng-if='!tag.master'>–</button>\n" +
    "<button ng-click='addChild(tag); $event.stopPropagation();'>+</button>\n" +
    "</div>\n" +
    "<div class='new-tag-form' ng-if='tag.dummy'>\n" +
    "<input mb-autofocus='true' ng-keyup='$event.keyCode == 13 &amp;&amp; saveNewTag(tag)' ng-model='tag.content.title' placeholder='' should-focus='true'>\n" +
    "</div>\n" +
    "</div>\n" +
    "</div>\n" +
    "<div ng-repeat='child in tag.children'>\n" +
    "<div change-parent='changeParent()' class='tag-tree' create-tag='createTag()' delete-tag='deleteTag()' ng-if='!child.deleted' on-select='onSelect()' save-tags='saveTags()' tag='child'></div>\n" +
    "</div>\n" +
    "</div>\n"
  );


  $templateCache.put('home.html',
    "<div class='sn-component'>\n" +
    "<div class='content'>\n" +
    "<div class='header'>\n" +
    "<h4 class='body-text-color'>Folders</h4>\n" +
    "</div>\n" +
    "<div change-parent='changeParent' class='tag-tree master' create-tag='createTag' delete-tag='deleteTag' on-select='selectTag' save-tags='saveTags' tag='masterTag'></div>\n" +
    "</div>\n" +
    "</div>\n"
  );

}]);
