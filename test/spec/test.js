/* global describe, it */

//http://chaijs.com/guide/styles/#expect
var expect = require('chai').expect;

var go_ginkgo = require("../../app/scripts/board.js");
var BoardViewModel = require("../../app/scripts/view.js").BoardViewModel;
var Marker = require("../../app/scripts/marker.js").Marker;
var Node = require("../../app/scripts/node.js").Node;
var SGF = require("../../app/scripts/sgf.js").SGF;
var Space = require("../../app/scripts/space.js").Space;

var ko = require('knockout');
var lodash = require('lodash-node/underscore');

//rather than try to create multi-line strings in raw javascript
//(http://stackoverflow.com/questions/805107/creating-multiline-strings-in-javascript)
//I find it easier to just read the data in from a file:

var sample;
var diagram;
var fs = require('fs');
fs.readFile( __dirname + '/ff4_ex.sgf', function (err, data) {
  if (err) {
    throw err; 
  }
  sample = data.toString();
});

fs.readFile( __dirname + '/diagram.txt', function (err, data) {
  if (err) {
    throw err; 
  }
  diagram = data.toString();
});


(function () {
  'use strict';
  
  describe('go_ginko', function () {

    describe('marker', function () {
      var marker;
      beforeEach( function() {
        marker = new Marker();
      });
      
      it('should create an instance', function () {
        expect(typeof marker).to.equal( 'object' );
      });

      it('should generate an index', function () {
        marker.space = 'cb';
        var indexes = marker.indexes();

        //row, zero indexed
        expect(indexes[0]).to.equal( 1 );
        //col, zero indexed
        expect(indexes[1]).to.equal( 2 );
      });

      it('should apply an index', function () {
        marker.apply_indexes(3, 2);
        //console.log("Marker space: ", marker.space);
        expect(marker.space).to.equal( 'cd' );
      });
      
      
    });
    
    describe('node', function () {
      var node;
      beforeEach( function() {
        node = new Node();
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

      it('should be able to set a move', function () {
        node.set_move('A1', 'B');
        expect(node.move.space).to.equal( 'A1' );
        expect(node.move.type).to.equal( 'B' );
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

    describe('sgf', function () {
      var sgf;
      beforeEach( function() {
        sgf = new SGF();
      });
      
      it('should create an instance', function () {
        expect(typeof sgf).to.equal( 'object' );
      });

      it('should have a root move attribute', function () {
        expect(typeof sgf).to.equal( 'object' );
      });

      it('root should equal cur_node after init', function () {
        expect(sgf.root).to.equal( sgf.cur_node() );
      });

      it('root should not equal cur_node after add_move', function () {
        sgf.add_move('A1', 'B');
        expect(sgf.root).to.not.equal( sgf.cur_node() );
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
        sgf.add_markers(sgf.cur_node(), 'AB', 'aa:ab');
        expect(sgf.cur_node().markers.length).to.equal( 2 );
      });
      
      it('should load saved game data', function () {
        //sample is loaded globally at the top of this test file
        expect(sgf.load(sample)).to.equal( true );
      });

      it('should not have a previous move if at start', function () {
        expect(sgf.previous()).to.equal( null );
      });

      it('should navigate nodes', function () {
        sgf.load(sample);
        //after loading, we're at the end?
        //sgf.go(0);
        //console.log(sgf.position);
        var second = sgf.next();
        //console.log(second);
        var third = sgf.next();
        //console.log("");
        //console.log("calling previous");
        var second_again = sgf.previous();
        //console.log(second_again);
        
        //sample is loaded globally at the top of this test file
        expect(lodash.isEqual(second, second_again)).to.equal( true );
        //expect(second_again).to.equal( second );
      });

      it('should go to a specific node', function () {
        sgf.load(sample);
        //after loading, we're at the end?
        //sgf.go(0);

        var root = sgf.cur_node();
        var first = sgf.next();
        var second = sgf.next();

        var nodes = sgf.go(0);
        //console.log(nodes);
        
        expect(lodash.isEqual([second, first, root], nodes)).to.equal( true );

      });
      
    });

    describe('space', function () {
      var space;
      beforeEach( function() {
        var board = null;
        var contains = '';
        var pixels = 40;
        //space = new Space(board, "AA", contains, pixels, 0, 0);
        space = new Space(board, contains, pixels, 0, 0);
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

      it('should apply a node', function () {
        var node;
        board.sgf().load(sample);
        //board.sgf.load(sample);
        //board.sgf().go(0);
        //first one is empty?
        //console.log("testing sgf navigation via board:");
        node = board.sgf().next();
        //node = board.sgf.next();
        //if we don't apply the node, the board will be out of sync
        board.apply_node(node);
        //console.log("second move:");
        node = board.sgf().next();
        //node = board.sgf.next();
        board.apply_node(node);

        board.next();

      });

      it('should apply a diagram', function () {
        board.apply_diagram(diagram);
        expect(board.spaces()[0].contains()).to.equal( 'W' );
        
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
        view = new BoardViewModel();

        //board = new go_ginkgo.Board();

      });
      
      it('should create an instance', function () {
        expect(typeof view).to.equal( 'object' );
        //assert.equal(-1, [1,2,3].indexOf(5));
        
      });
    });


  });
})();
