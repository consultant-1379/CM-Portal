'use strict';

var should = require('should'),
  errorHandler = require('../../../../modules/core/server/controllers/errors.server.controller');

describe('Error Handling Tests:', function () {
  describe('Error Messages', function () {
    it('should trigger validation error without errors object', async function () {
      var err = {
        message: 'This is my error message'
      }
      errorHandler.getErrorMessage(err).should.equal('This is my error message');
    });

    it('should trigger validation error with errors object', function () {
      var err = {
        message: 'This is my error message',
        name: 'ValidationError',
        errors: {
          error1: {
            message: 'error 1A'
          }
        }
      }
      errorHandler.getErrorMessage(err).should.equal('error 1A');
    });

    it('should trigger validation error without ValidationError name', async function () {
      var err = {
        message: 'This is my error message',
        errors: 'error 1A'
      }
      errorHandler.getErrorMessage(err).message.should.equal('This is my error message');
    });
  });
});
