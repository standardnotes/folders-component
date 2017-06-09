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
    "<div class='info'>\n" +
    "<div class='circle' ng-class='circleClassForTag(tag)'></div>\n" +
    "<div class='title' ng-if='!tag.dummy'>\n" +
    "{{tag.displayTitle}}\n" +
    "</div>\n" +
    "<div class='hover-menu' ng-if='!tag.dummy'>\n" +
    "<button ng-click='addChild(tag); $event.stopPropagation();'>+</button>\n" +
    "</div>\n" +
    "<div class='new-tag-form' ng-if='tag.dummy'>\n" +
    "<input autofocus='true' ng-keyup='$event.keyCode == 13 &amp;&amp; saveNewTag(tag)' ng-model='tag.title' placeholder=''>\n" +
    "</div>\n" +
    "</div>\n" +
    "</div>\n" +
    "<div ng-repeat='child in tag.children'>\n" +
    "<div change-parent='changeParent()' class='tag-tree' create-tag='createTag()' on-select='onSelect()' tag='child'></div>\n" +
    "</div>\n" +
    "</div>\n"
  );


  $templateCache.put('home.html',
    "<div class='header'>\n" +
    "<h3>Tags</h3>\n" +
    "</div>\n" +
    "<div change-parent='changeParent' class='tag-tree master' create-tag='createTag' on-select='selectTag' tag='masterTag'></div>\n"
  );

}]);
