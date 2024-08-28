(function () {
  'use strict';

  describe('Products Route Tests', function () {
    var $scope,
      ProductsService;

    beforeEach(module('myapp'));

    beforeEach(inject(function ($rootScope, _ProductsService_) {
      $scope = $rootScope.$new();
      ProductsService = _ProductsService_;
    }));

    describe('Route Config', function () {
      describe('Create Route', function () {
        var createState;
        beforeEach(inject(function ($state) {
          createState = $state.get('products.create');
        }));

        it('should have the correct URL', function () {
          expect(createState.url).toEqual('/create');
        });

        it('should not be abstract', function () {
          expect(createState.abstract).toBe(undefined);
        });
      });
    });
  });
}());
