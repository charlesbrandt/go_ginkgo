'use strict';

var lodash = require('lodash-node/underscore');
var ko = require('knockout');
var moment = require('moment');

var SGFNode = require('./node').Node;

function SGF() {  
  var self = this;

  //setup... this should only happen once for the object
  //then reset (clear?) should re-initialize

  //now that Node object exists, we can track everything there
  //start with a blank object
  self.root = new SGFNode();
  self.root.name = 'root';

  //position needs to be an array of indexes 
  //multiple points required to get to correct branch
  //self.position = [ ];
  //making this observable so that it can trigger updates in the DOM
  self.position = ko.observableArray();
  
  self.cur_node = ko.observable(self.root);
  //self.cur_node = self.root;
  self.empty = true;    
  
  // game-info properties
  self.annotation = ko.observable(''); //AN
  self.black_rank = ko.observable(''); //BR
  self.black_team = ko.observable(''); //BT
  self.black_player = ko.observable('');//PB
  
  self.copyright = ko.observable('');//CP
  self.date = ko.observable('');//DT
  
  self.event = ko.observable('');//EV
  self.comment = ko.observable('');//GC
  self.name = ko.observable('');//GN
  self.opening = ko.observable('');//ON
  self.overtime = ko.observable('');//*OT
  
  self.place = ko.observable('');//PC 
  
  self.result = ko.observable('');//!RE
  self.round = ko.observable('');//RO
  self.rules = ko.observable('');//!RU 
  self.source = ko.observable('');//SO
  self.timelimit = ko.observable('');//TM 
  self.user = ko.observable('');//US
  
  self.white_player = ko.observable('');//PW
  self.white_rank = ko.observable('');//WR
  self.white_team = ko.observable('');//WT 

  self.handicap = ko.observable(''); //HA
  self.komi = ko.observable(''); //KM
  

  
  //whether or not to show some console messages
  self.debug = false;
  
  self.reset = function(size) {
    
    self.position.removeAll();

    // root level properties
    // not currently making the distinction of different games in one SGF
    self.format = '4'; //FF

    if (size) { 
      self.size = size; //SZ
    }
    else {
      self.size = '19'; //SZ
    }
      
    self.game = '1'; //GM

    //really only needed when calling self.serialize():
    self.application = 'Go Ginkgo 0.1'; //AP

    ///////////////
    //Observables:
    ///////////////
    
    //now that Node object exists, we can track everything there
    //start with a blank object
    self.root = new SGFNode();  
    self.root.name = 'root';
    self.cur_node(self.root);
    self.empty = true;    
    
    // game-info properties
    self.annotation(''); //AN
    self.black_rank(''); //BR
    self.black_team(''); //BT
    self.black_player('Black');//PB
    
    self.copyright('');//CP
    //console.log(self.date());
    self.date(moment().format('YYYY/MM/DD'));//DT
    self.event('');//EV
    self.comment('');//GC
    self.name('');//GN
    self.opening('');//ON
    self.overtime('');//*OT

    //self.place('');//PC 
    //self.place = ko.observable('');//PC 
    self.place('');//PC
    
    self.result('');//!RE
    self.round('');//RO
    self.rules('');//!RU 
    self.source('');//SO
    self.timelimit('');//TM 
    self.user('');//US

    self.white_player('White');//PW
    self.white_rank('');//WR
    self.white_team('');//WT 

    self.handicap(''); //HA
    self.komi(''); //KM
    
  };

  self.reset(19);

  self.last = ko.computed(function() {
    //start with the cur_pos length
    var total = self.position().length;
    //then go through all children, defaulting to first, and tally those up
    var temp_node = self.cur_node();
    while (temp_node) {
      if (temp_node.children.length) {
        total += 1;
        temp_node = temp_node.children[0];
      }
      else {
        temp_node = false;
      }
    }
    return total;
    
  });

  
  self.go = function(index) {
    //go to the given index file.
    //generate a list of nodes in the order they should be applied
    var nodes = [];
    var cur_node;
    var at_end = false;
    var at_beginning = false;
    //console.log(self.position());    
    //console.log(self.position().length);    

    //handle if we're moving forward
    while ((index > self.position().length) && (! at_end)) {
      cur_node = self.next();
      if (cur_node) {
        nodes.push(cur_node);
      }
      else {
        at_end = true;
      }
    }
    
    //handle if we're moving backward
    //if going backwards, we want to include the current node in the list
    if (index < self.position().length) {
      nodes.push(self.cur_node());
      while ((index < self.position().length) && (! at_beginning)) {
        cur_node = self.previous();
        if (cur_node) {
          nodes.push(cur_node);
        }
        else {
          at_beginning = true;
        }
      }
    }

    return nodes;    
  };
  
  self.next = function(branch) {
    //change position
    //retun node
    //board state will be updated by the board object
    if (self.cur_node().children.length) {
      if (branch) {
        if (branch < self.cur_node().children.length) {
          //self.cur_node = self.cur_node.children[branch];
          self.cur_node(self.cur_node().children[branch]);
          self.position.push(branch);
        }
        else {
          var err = new ReferenceError('Invalid branch: ' + branch + ' cur_node only has: ' + self.cur_node().children.length + ' children.' + self.cur_node());
          throw err;
        }
      }
      else {
        //self.cur_node = self.cur_node.children[0];
        self.cur_node(self.cur_node().children[0]);
        self.position.push(0);
      }
      return self.cur_node();
    }
    else {
      //console.log("No more moves!");
      return null;
    }
  };
  
  self.previous = function() {
    //change position
    //retun node
    //board state will be updated by the board object
    if (self.cur_node().parent) {
      //self.cur_node = self.cur_node.parent;
      self.cur_node(self.cur_node().parent);
      self.position.pop();
      return self.cur_node();
    }
    else {
      //console.log("No more moves!");
      return null;
    }    
  };
  
  self.make_point_list = function(value) {
    //split up a pointlist from an sgf file into individual points
    //as needed for each marker
    var point_list = [];
    var parts = value.split(':');
    if (parts.length === 2) {
      var start = parts[0];
      var end = parts[1];

      //console.log(start[0], start[1], end[0], end[1]);
      
      var start_row = start[0].charCodeAt(0);
      var start_col = start[1].charCodeAt(0);
      var end_row = end[0].charCodeAt(0);
      var end_col = end[1].charCodeAt(0);

      //console.log(start_row, start_col, end_row, end_col);

      for (var i = start_row; i <= end_row; i++) {
        for (var j = start_col; j <= end_col; j++) {
          point_list.push(String.fromCharCode(i) + String.fromCharCode(j));
        }
      }
    }
    else {
      point_list.push(value);
    }
    //console.log(point_list);
    return point_list;
  };

  //self.add_move = function(position, color) {
  self.add_move = function(row, col, color) {
    //use the current position to add the move
    //if there is already an existing move at this position
    //add a new branch
    //keep adding on current branch, unless previous branch is restored
    //will need to use position to find current branch
    //and should also update position accordingly

    //var index = self.cur_node().add_move(position, color);
    var index = self.cur_node().add_move(row, col, color);
    self.position.push(index);

    //update our cur_node:
    //self.cur_node = self.cur_node.children[index];
    self.cur_node(self.cur_node().children[index]);
    self.empty = false;
    
    return self.cur_node();
  };

  self.add_node = function() {
    if (self.empty) {
      self.empty = false;
      return self.cur_node();
    }
    else {
      var index = self.cur_node().make_node();
      //console.log("New index: ", index);
      self.position.push(index);
      //self.cur_node = self.cur_node.children[index];
      self.cur_node(self.cur_node().children[index]);
      return self.cur_node();
    }
  };
  
  self.add_markers = function(node, id, value) {
    var point_list = self.make_point_list(value);
    lodash.each(point_list, function(point) {
      node.add_marker(point, id);
    });
  };

  /*
  self.add_territory = function(node, id, value) {
    var point_list = self.make_point_list(value);
    lodash.each(point_list, function(point) {
      node.add_territory(point, id);
    });
  };
  */

  self.add_labels = function(node, id, value) {
    //we know id == "LB" in this case... don't need to use that in Marker object
    var parts = value.split(':');
    var point = parts[0];
    var label = parts[1];
    node.add_label(point, label);
  };

  self.add_stones = function(node, id, value) {
    var point_list = self.make_point_list(value);
    lodash.each(point_list, function(point) {
      node.add_stone(point, id);
    });
  };
  
  self.handle_substring = function(data, start, index, cur_sequences) {
    /*helper to push the current substring on to the list
      but only if it has data

      keeping the trimmed version here, but could keep original if needed
    */
    
    var cur_string = data.substring(start, index);
    //strip whitespace:
    cur_string = cur_string.trim();
    if (cur_string) {
      //for keeping original
      //cur_sequences.push(data.substring(start, index));
      //for keeping trimmed version:
      cur_sequences.push(cur_string);
    }
  };
  
  self.parse_property_value = function(data) {
    /* helper to scan to the end of a property value, designated with ']'
       this avoids handling parenthesis within a property value
       e.g. in comments
    */

    var next_char = '';
    var previous_char = '';
    var result = {};    
    var index = 0;
    var start = index;
    
    while (index < data.length) {
      next_char = data[index];
      //be sure to check for escaped ']'...
      if ( (next_char === ']') && (previous_char !== '\\') ) {
        result = { 'index': index+1,
                   'sequences': '[' + data.substring(start, index) + ']' };
        return result; 
      }
      previous_char = next_char;
      index += 1;
    }
  };
  
  self.parse_sequences = function(data) {
    /* a recursive call to split up all sequences into actual lists of lists
       so they can be processed together
       
       expects that the open parenthesis was already found
       scan until we find our matching close parenthesis

       the end result will always have one extra surrounding list
       eg. self.parse_sequences('') == ['']

       good reminder on the different ways to manually parse a tree:
       http://www.sunshine2k.de/coding/java/SimpleParser/SimpleParser.html
    */

    //console.log("Starting with ->", data, "<-");

    var next_char = '';
    var cur_sequences = [];
    var result = {};
    var remainder;
    
    var index = 0;
    var start = index;
    while (index < data.length) {
      next_char = data[index];
      if (next_char === '(') {

        self.handle_substring(data, start, index, cur_sequences);
    
        //move past current open parenthesis:
        index += 1;

        remainder = data.substring(index);

        result = self.parse_sequences(remainder);

        //move ahead the amount we've parsed
        index += result.index;
        start = index;
        //cur_sequences.push(result['sequences']);
        cur_sequences.push(result.sequences);

        //console.log("finished parsing,", index, cur_sequences);
        //console.log(data);
        //console.log(data.substring(index));
      }

      else if (next_char === '[') {
        //parse a property value too...
        //this will prevent parsing parenthesis within a property value

        self.handle_substring(data, start, index, cur_sequences);

        //move past current open bracket:
        index += 1;

        remainder = data.substring(index);

        result = self.parse_property_value(remainder);

        index += result.index;
        start = index;
        //cur_sequences.push(result['sequences']);
        cur_sequences.push(result.sequences);
      }

      else if (next_char === ')') {
        self.handle_substring(data, start, index, cur_sequences);

        //cur_sequences.push(data.substring(start, index));
        result = { 'index': index+1,
                   'sequences': cur_sequences };
        //console.log(result);
        //shouldn't be necessary... return should break the while loop..
        //closed = true;
        return result; 
      }

      else {
        //shouldn't need to worry about anything else... not parsing tokens yet
        index += 1;
      }

    }
    result = { 'index': index+1,
               'sequences': cur_sequences };
    return result;    
  };

  
  self.handle_sequence = function(sequence, parent) {
    /* recursive call to convert a sequence into actual javascript nodes 
       within this SGF object
       for use in system
    */
    
    var last_property_id = '';
    var local_cur_node = parent;
    var token_value;
    lodash.each(sequence, function(item) {
      if (typeof item === 'string') {
        if (item[0] === '[') {
          // must have a property value...
          // process that
          // base action on last_property_id value
          // http://www.red-bean.com/sgf/proplist_t.html
          token_value = item.substring(1, item.length-1);

          //a move is currently the only action that changes the local_cur_node
          if (last_property_id === 'B') {
            //local_cur_node = self.add_move(token_value, 'B');
            local_cur_node.set_move(token_value, 'B');
          } else if (last_property_id === 'W') {
            //local_cur_node = self.add_move(token_value, 'W');
            local_cur_node.set_move(token_value, 'W');

          //passes are handled with empty property values of B[] or W[]
          //PL does not require a move to apply
          //PL   Player to play  setup            color
          } else if (last_property_id === 'PL') {
            //local_cur_node.player = token_value;
            //local_cur_node.next_move = token_value;
            local_cur_node.next_move(token_value);
            
          } else if (last_property_id === 'C') {
            //have a comment
            //self.cur_node.comment = token_value;
            //local_cur_node.comment = token_value;
            local_cur_node.comment(token_value);

          } else if (last_property_id === 'N') {
            //self.cur_node.name = token_value;
            local_cur_node.name = token_value;

          //markers
          //need to break up any point lists appropriately
          //http://www.red-bean.com/sgf/sgf4.html

          /*          
           AB   Add Black       setup            list of stone
           AE   Add Empty       setup            list of point
           AW   Add White       setup            list of stone
          */
          } else if ( (last_property_id === 'AB') ||
                      (last_property_id === 'AE') ||
                      (last_property_id === 'AW')
                    ){
            self.add_stones(local_cur_node, last_property_id, token_value);

          /*
            CR   Circle          -                list of point
            MA   Mark            -                list of point
            SL   Selected        -                list of point
            *SQ  Square          -                list of point
            TR   Triangle        -                list of point
          */
          } else if ( (last_property_id === 'CR') ||
                      (last_property_id === 'MA') ||
                      (last_property_id === 'SL') ||
                      (last_property_id === 'SQ') ||
                      (last_property_id === 'TR') 
                    ){
            self.add_markers(local_cur_node, last_property_id, token_value);

          //!LB  Label       -   list of composed point ':' simpletext 
          } else if ( (last_property_id === 'LB') ||
                      (last_property_id === 'L')
                    ){
            self.add_labels(local_cur_node, last_property_id, token_value);
            
          //TB   Territory Black -                elist of point
          //TW   Territory White -                elist of point
          } else if ( (last_property_id === 'TB') ||
                      (last_property_id === 'TW')
                    ){
            //self.add_territory(local_cur_node, last_property_id, token_value);
            self.add_markers(local_cur_node, last_property_id, token_value);

          //root
          } else if (last_property_id === 'FF') {
            self.format = token_value; //FF
          } else if (last_property_id === 'SZ') {
            self.size = token_value; //SZ
          } else if (last_property_id === 'GM') {
            self.game = token_value; //GM          

          //not sure that we want to keep this here...
          //after data has been read in, it will be formatted differently
          //} else if (last_property_id === 'AP') {
          //  self.application = token_value; //AP
            
          } else if (last_property_id === 'AN') {
            //self.annotation = token_value; //AN
            self.annotation(token_value); //AN
          } else if (last_property_id === 'BR') {
            //self.black_rank = token_value; //BR
            self.black_rank(token_value); //BR
          } else if (last_property_id === 'BT') {
            //self.black_team = token_value; //BT
            self.black_team(token_value); //BT
          } else if (last_property_id === 'PB') {
            //self.black_player = token_value; //PB
            self.black_player(token_value); //PB
          } else if (last_property_id === 'CP') {
            //self.copyright = token_value; //CP
            self.copyright(token_value); //CP
          } else if (last_property_id === 'DT') {
            //self.date = token_value; //DT
            self.date(token_value); //DT
          } else if (last_property_id === 'EV') {
            //self.event = token_value; //EV
            self.event(token_value); //EV
          } else if (last_property_id === 'GC') {
            //self.comment = token_value; //GC
            self.comment(token_value); //GC
          } else if (last_property_id === 'GN') {
            //self.name = token_value; //GN
            self.name(token_value); //GN
          } else if (last_property_id === 'ON') {
            //self.opening = token_value; //ON
            self.opening(token_value); //ON
          } else if (last_property_id === 'OT') {
            //self.overtime = token_value; //OT
            self.overtime(token_value); //OT
          } else if (last_property_id === 'RE') {
            //self.result = token_value; //RE
            self.result(token_value); //RE
          } else if (last_property_id === 'RO') {
            //self.round = token_value; //RO
            self.round(token_value); //RO
          } else if (last_property_id === 'RU') {
            //self.rules = token_value; //RU
            self.rules(token_value); //RU
          } else if (last_property_id === 'SO') {
            //self.source = token_value; //SO
            self.source(token_value); //SO
          } else if (last_property_id === 'TM') {
            //self.timelimit = token_value; //TM 
            self.timelimit(token_value); //TM 
          } else if (last_property_id === 'US') {
            //self.user = token_value; //US
            self.user(token_value); //US
          } else if (last_property_id === 'PW') {
            //self.white_player = token_value; //PW
            self.white_player(token_value); //PW
          } else if (last_property_id === 'WR') {
            //self.white_rank = token_value; //WR
            self.white_rank(token_value); //WR
          } else if (last_property_id === 'WT') {
            //self.white_team = token_value; //WT 
            self.white_team(token_value); //WT 
          } else if (last_property_id === 'PC') {
            //self.place = token_value; //PC 
            self.place(token_value); //PC
            //console.log(self.place());
          } else if (last_property_id === 'HA') {
            self.handicap(token_value); //HA
          } else if (last_property_id === 'KM') {
            self.komi(token_value); //KM

/*
TODO / not processed:
*AR  Arrow           -                list of composed point ':' point

*DD  Dim points      - (inherit)      elist of point
DM   Even position   -                double
!FG  Figure          -                none | composed number ":" simpletext
GB   Good for Black  -                double
GW   Good for White  -                double
HO   Hotspot         -                double
*LN  Line            -                list of composed point ':' point
*PM  Print move mode - (inherit)      number
            
UC   Unclear pos     -                double
V    Value           -                real
*VW  View            - (inherit)      elist of point            

*/

            
          } else {
            //might want to see what properties were not applied from a SGF
            //but sometimes don't want to see the output:
            if (self.debug) {
              console.log(last_property_id + ': ->' + token_value + '<-');
            }
          }
            
        }
        else {
          // must be a property id
          // process that

          //console.log(item);

          while (item[0] === ';') {
            //now this is the only place new nodes are created!
            local_cur_node = self.add_node();
            item = item.substring(1);
          }
          last_property_id = item.trim();
        }
        //console.log(item);
      }
      
      else if (item instanceof Array) {
        self.handle_sequence(item, local_cur_node);
        //console.log("ARRAY");
        //console.log("ARRAY", item);
        //console.log(item);
      }
      
      else {
        //this is probably an error
        console.log(typeof item);
      }

    });
  };
  
  self.load = function(data) {
    //load moves from an existing SGF data stream (do not change position)
    //should probably check that position is 0, no existing moves...
    //that or else clear everything previous out...
    //that includes resetting board state...
    //go_to(0) first?

    var sequences = self.parse_sequences(data);

    //reset everything:
    self.reset();
    
    lodash.each(sequences, function(sequence) {
      self.handle_sequence(sequence, self.root);
    });
    self.go(0);
    return true;
  };
  
  self.serialize = function() {
    //return a string representation of the SGF
    var result = '(;FF[4]AP[' + self.application + ']';

    if (self.annotation()) {
      result += 'AN[' + self.annotation() + ']';
    }
    
    if (self.black_rank()) {
      result += 'BR[' + self.black_rank() + ']';
    }
    
    if (self.black_team()) {
      result += 'BT[' + self.black_team() + ']';
    }
    
    if (self.black_player()) {
      result += 'PB[' + self.black_player() + ']';
    }    
    
    if (self.copyright()) {
      result += 'CP[' + self.copyright() + ']';
    }
    
    if (self.date()) {
      result += 'DT[' + self.date() + ']';
    }
    
    if (self.event()) {
      result += 'EV[' + self.event() + ']';
    }
    
    if (self.comment()) {
      result += 'GC[' + self.comment() + ']';
    }
    
    if (self.name()) {
      result += 'GN[' + self.name() + ']';
    }
    
    if (self.opening()) {
      result += 'ON[' + self.opening() + ']';
    }
    
    if (self.overtime()) {
      result += 'OT[' + self.overtime() + ']';
    }
        
    if (self.place()) {
      result += 'PC[' + self.place() + ']';
    }    
    
    if (self.result()) {
      result += 'RE[' + self.result() + ']';
    }
    
    if (self.round()) {
      result += 'RO[' + self.round() + ']';
    }
    
    if (self.rules()) {
      result += 'RU[' + self.rules() + ']';
    }
    
    if (self.source()) {
      result += 'SO[' + self.source() + ']';
    }
    
    if (self.timelimit()) {
      result += 'TM[' + self.timelimit() + ']';
    }
    
    if (self.user()) {
      result += 'US[' + self.user() + ']';
    }
        
    if (self.white_player()) {
      result += 'PW[' + self.white_player() + ']';
    }
    
    if (self.white_rank()) {
      result += 'WR[' + self.white_rank() + ']';
    }
    
    if (self.white_team()) {
      result += 'WT [' + self.white_team() + ']';
    }
        
    if (self.handicap()) {
      result += 'HA[' + self.handicap() + ']';
    }
    
    if (self.komi()) {
      result += 'KM[' + self.komi() + ']';
    }
    
    result += self.root.render();
    result += ')';
    return result;
  };
  
}

module.exports.SGF = SGF;
