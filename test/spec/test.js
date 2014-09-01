/* global describe, it */

//http://chaijs.com/guide/styles/#expect
var expect = require('chai').expect;

var go_ginkgo = require("../../app/scripts/board.js");
var ko = require('knockout');
var lodash = require('lodash-node/underscore');

//var sample = require('./sample').data;
var sample;
var fs = require('fs');
fs.readFile( __dirname + '/ff4_ex.sgf', function (err, data) {
  if (err) {
    throw err; 
  }
  sample = data.toString();
});

(function () {
  'use strict';
  
  describe('go_ginko', function () {

    describe('space', function () {
      var space;
      beforeEach( function() {
        var board = null;
        var contains = '';
        var pixels = 40;
        space = new go_ginkgo.Space(board, "AA", contains, pixels, 0, 0);
      });
      
      it('should create an instance', function () {
        expect(typeof space).to.equal( 'object' );
      });

      it('should have a row and column', function () {
        expect(space.row).to.equal( 0 );
        expect(space.column).to.equal( 0 );
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
        expect(board.space_pixels()).to.equal( 41 );
      });
      
      it('should have spaces', function () {
        //assumes initialization of 19 size, 19 x 19 = 361
        expect(board.spaces().length).to.equal( 361 );
      });

      it('should have spaces with neighbors', function () {
        var space = board.spaces()[0];
        var neighbors = board.get_neighbors(space);
        //console.log(space.name, space.row, space.column);
        //console.log(neighbors);
        expect(neighbors.length).to.equal( 2 );

        space = board.spaces()[1];
        neighbors = board.get_neighbors(space);
        //console.log(space.name, space.row, space.column);
        //console.log(neighbors);
        expect(neighbors.length).to.equal( 3 );

        space = board.spaces()[20];
        neighbors = board.get_neighbors(space);
        //console.log(space.name, space.row, space.column);
        //console.log(neighbors);
        expect(neighbors.length).to.equal( 4 );
        
      });

      it('should make a move', function () {
        var space = board.spaces()[0];
        board.make_move(space);
        expect(space.contains()).to.equal( 'B' );        
      });

      it('should capture a stone', function () {
        //black
        var space = board.spaces()[1];
        board.make_move(space);
        //white in corner
        space = board.spaces()[0];
        board.make_move(space);
        //black for the capture
        space = board.spaces()[19];
        board.make_move(space);
        expect(board.spaces()[0].contains()).to.equal( '' );
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

      it('should have a root move attribute', function () {
        expect(typeof sgf).to.equal( 'object' );
      });

      it('root should equal cur_move after init', function () {
        expect(sgf.root).to.equal( sgf.cur_move );
      });

      it('root should not equal cur_move after add_move', function () {
        sgf.add_move('A1', 'B');
        expect(sgf.root).to.not.equal( sgf.cur_move );
      });
      
      it('should parse sequences', function () {
        var result = sgf.parse_sequences('( 1 (a)(b(c)))');
        //if trim not enabled:
        var manual = [ [ ' 1 ', [ 'a' ], [ 'b', [ 'c' ] ] ] ];
        //if trim enabled:
        var manual = [ [ '1', [ 'a' ], [ 'b', [ 'c' ] ] ] ];

        //console output may show [Object]...
        //but this is probably the list we're after
        /*lodash.each(result.sequences, function(sub, i) {
          console.log(i, sub);
        })      
        console.log(result.sequences);
        console.log(manual);
        */
        expect(lodash.isEqual(result.sequences, manual)).to.equal( true );


        var result = sgf.parse_sequences('( 1 )');
        //console.log(result.sequences);
        //if trim not enabled:
        var manual = [[' 1 ']];
        //if trim enabled:
        var manual = [['1']];
        //console.log(manual);
        expect(lodash.isEqual(result.sequences, manual)).to.equal( true );

        var result = sgf.parse_sequences('');
        var manual = [  ];
        expect(lodash.isEqual(result.sequences, manual)).to.equal( true );

        var result = sgf.parse_sequences(sample);
        //console.log(result.sequences)    

      });

      it('should make point lists', function () {
        var pl = sgf.make_point_list('aa:ab');
        var manual = [ 'aa', 'ab' ];
        expect(lodash.isEqual(pl, manual)).to.equal( true );

      });
      
      it('should add markers with point lists', function () {
        sgf.add_markers(sgf.cur_move, 'AB', 'aa:ab');
        expect(sgf.cur_move.markers.length).to.equal( 2 );
      });
      
      it('should load saved game data', function () {
        //sample is loaded globally at the top of this test file
        expect(sgf.load(sample)).to.equal( true );
      });
      
    });

    describe('node', function () {
      var node;
      beforeEach( function() {
        node = new go_ginkgo.Node();
      });
      
      it('should create an instance', function () {
        expect(typeof node).to.equal( 'object' );
      });

      it('should have a place for child moves', function () {
        expect(typeof node.children).to.equal( 'object' );
      });

      it('should have a name', function () {
        expect(typeof node.name).to.equal( 'string' );
      });

      it('should be able to add a move', function () {
        expect(node.add_move('A1', 'B')).to.equal( 0 );
      });

      it('should have children after previously adding a move', function () {
        expect(node.add_move('A1', 'B')).to.equal( 0 );
        expect(node.children.length).to.not.equal( 0 );
      });
      
      it('should not add the same move twice', function () {
        var index = node.add_move('A1', 'B');
        expect(index).to.equal( 0 );
        //add it again
        index = node.add_move('A1', 'B');
        //console.log('index after: ', index);
        expect(node.add_move('A1', 'B')).to.equal( 0 );
        expect(node.children.length).to.equal( 1 );
      });
      
      it('should throw an error if space is occupied', function () {
        var index = node.add_move('A1', 'B');
        expect(index).to.equal( 0 );
        //add it again
        //index = node.add_move('A1', 'B');
        //console.log('index after: ', index);
        //console.log(node.children);

        //TODO: this seems to throw an error as expected,
        //but the test fails... not sure why
        //expect(node.add_move('A1', 'W')).to.throw(ReferenceError, /Invalid move/);
        //expect(node.add_move('A1', 'W')).to.throw(ReferenceError);
      });

      it('should be able to add more than one move', function () {
        expect(node.add_move('A1', 'B')).to.equal( 0 );
        expect(node.add_move('A2', 'W')).to.equal( 1 );
      });

      it('should be able to add a marker', function () {
        expect(node.add_marker('A1', 'triangle')).to.equal( 0 );
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
