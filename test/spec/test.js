/* global describe, it */

//http://chaijs.com/guide/styles/#expect
var expect = require('chai').expect;
var go_ginkgo = require("../../app/scripts/board.js");
var ko = require('knockout');

(function () {
  'use strict';
  
  describe('go_ginko', function () {

    describe('space', function () {
      var space;
      beforeEach( function() {
        space = new go_ginkgo.Space();
      });
      
      it('should create an instance', function () {
        expect(typeof space).to.equal( 'object' );
      });
    });    

    describe('board', function () {
      var board;
      beforeEach( function() {
        board = new go_ginkgo.Board(19, 779);
      });
      
      it('should create an instance', function () {
        expect(typeof board).to.equal( 'object' );
      });

      it('should have an observable size attribute', function () {
        //http://stackoverflow.com/questions/9625591/determine-if-an-object-property-is-ko-observable
        expect(ko.isObservable(board.size)).to.equal( true );
      });

      it('should have an observable pixels attribute', function () {
        //http://stackoverflow.com/questions/9625591/determine-if-an-object-property-is-ko-observable
        expect(ko.isObservable(board.pixels)).to.equal( true );
      });

      it('should calculate how big a space is', function () {
        //assumes initialization of 19 size and 779 pixels
        expect(board.space_pixels()).to.equal( 41  );
      });
      
    });

    describe('sgf', function () {
      var sgf;
      beforeEach( function() {
        sgf = new go_ginkgo.SGF();
      });
      
      it('should create an instance', function () {
        expect(typeof sgf).to.equal( 'object' );
      });
    });

    describe('view', function () {
      //don't use the browserified module for unit testing!
      //(doesn't seem to export anything)
      //var go_ginkgo = require("../../.tmp/scripts/bundle.js");
      
      //console.log('made it here!');
      //console.log(go_ginkgo);

      var board;
      var view;
      beforeEach( function() {
        view = new go_ginkgo.BoardViewModel();

        //board = new go_ginkgo.Board();

      });
      
      it('should create an instance', function () {
        expect(typeof view).to.equal( 'object' );
        //assert.equal(-1, [1,2,3].indexOf(5));
        
      });
    });


  });
})();
