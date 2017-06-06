angular
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

      el.addEventListener(
        'dragstart',
        function(e) {
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

      var counter = 0;

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
        'drop',
        function(e) {
          // Stops some browsers from redirecting.
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
