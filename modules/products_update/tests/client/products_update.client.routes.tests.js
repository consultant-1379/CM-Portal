(function () {
  'use strict';

  describe('ProductUpdates Route Tests', function () {
    var $scope,
      ProductUpdatesService;

    beforeEach(module('myapp'));

    beforeEach(inject(function ($rootScope, _ProductUpdatesService_) {
      $scope = $rootScope.$new();
      ProductUpdatesService = _ProductUpdatesService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainState;
        beforeEach(inject(function ($state) {
          mainState = $state.get('productsUpdates');
        }));

        it('should have the correct URL', function () {
          expect(mainState.url).toEqual('/productsUpdates');
        });

        it('should be abstract', function () {
          expect(mainState.abstract).toBe(true);
        });

        it('should have template', function () {
          expect(mainState.template).toBe('<ui-view/>');
        });
      });

      describe('List Route', function () {
        var listState;
        beforeEach(inject(function ($state) {
          listState = $state.get('productsUpdates.list');
        }));

        it('should have the correct URL', function () {
          expect(listState.url).toEqual('');
        });

        it('should not be abstract', function () {
          expect(listState.abstract).toBe(undefined);
        });
      });

      describe('Create Route', function () {
        var createState;
        beforeEach(inject(function ($state) {
          createState = $state.get('productsUpdates.create');
        }));

        it('should have the correct URL', function () {
          expect(createState.url).toEqual('/create');
        });

        it('should not be abstract', function () {
          expect(createState.abstract).toBe(undefined);
        });
      });

      describe('View Route', function () {
        var viewState;
        beforeEach(inject(function ($state) {
          viewState = $state.get('productsUpdates.view');
        }));

        it('should have the correct URL', function () {
          expect(viewState.url).toEqual('/view/{productsUpdateId}');
        });

        it('should not be abstract', function () {
          expect(viewState.abstract).toBe(undefined);
        });
      });
    });
  });
}());
