'use strict';

function Grid(size, pixels, borders, hoshi) {
  // generate an SVG grid for use on a board
  // borders should be a list of booleans to signal if border should be shown
  // [ top, right, bottom, left ]
  //
  // hoshi is a list of where star points should go
  // index is upper left corner
  //
  // size and pixels are assumed to be single values... square grids only
  
  var self = this;

  self.size = size;

  self.top = borders[0];
  self.right = borders[1];
  self.bottom = borders[2];
  self.left = borders[3];
  
  var space = Math.floor(pixels/size);
  //console.log(space);

  //just want one space short for border:
  //this is a bit longer than we want after the round down:
  //var line_length = pixels - space;

  var line_length = space * (size-1);
  //console.log(line_length);
  var extra = pixels - line_length;
  //console.log(extra);
  var half_extra = extra / 2;

  //this isn't the right approach:
  //var half_space = Math.floor(space/2);

  var border_width = 8;
  //the amount to adjust the border line width to make corners line up
  var border_adjust = border_width / 2;

  var stroke_color = 'black';
  
  //this is where something like d3 might make life easier:
  self.line = function(x1, y1, x2, y2, stroke, stroke_width) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + stroke + '" stroke-width="' + stroke_width + '"></line>\n';
  };
  
  //start our svg:

  //To avoid:
  //This XML file does not appear to have any style information associated with it svg
  //include:
  //xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
  //http://www-archive.mozilla.org/projects/svg/faq.html
  self.result = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100%" height="100%" viewBox="0 0 ' + pixels + ' ' + pixels + '">\n';
  //Error: Invalid value for <svg> attribute preserveAspectRatio="xMaxYmax"
  
  // horizontal lines
  var cur_pos_x = half_extra;
  var cur_pos_y = half_extra;

  if (self.top) {
    self.result += self.line(cur_pos_x-border_adjust, cur_pos_y, cur_pos_x+line_length+border_adjust, cur_pos_y, stroke_color, border_width);
  }
  cur_pos_y += space;

  //starting at 2... skipping beginning and end borders
  for (var i = 2; i < self.size; i++) {
    self.result += self.line(cur_pos_x, cur_pos_y, cur_pos_x+line_length, cur_pos_y, stroke_color, 4);
    cur_pos_y += space;
  }

  if (self.bottom) {
    self.result += self.line(cur_pos_x-border_adjust, cur_pos_y, cur_pos_x+line_length+border_adjust, cur_pos_y, stroke_color, border_width);
  }
  //cur_pos_y += space;

  // vertical lines
  cur_pos_x = half_extra;
  cur_pos_y = half_extra;

  if (self.left) {
    //not critical to do border adjust here (horizontal lines take care of it)
    //but just to be consistent
    //self.result += self.line(cur_pos_x, cur_pos_y, cur_pos_x, cur_pos_y+line_length, stroke_color, border_width);
    self.result += self.line(cur_pos_x, cur_pos_y-border_adjust, cur_pos_x, cur_pos_y+line_length+border_adjust, stroke_color, border_width);
  }
  cur_pos_x += space;

  //starting at 2... skipping beginning and end borders
  for (i = 2; i < self.size; i++) {
    self.result += self.line(cur_pos_x, cur_pos_y, cur_pos_x, cur_pos_y+line_length, stroke_color, 4);
    cur_pos_x += space;
  }

  if (self.right) {
    self.result += self.line(cur_pos_x, cur_pos_y, cur_pos_x, cur_pos_y+line_length, stroke_color, border_width);
  }

  // now take care of the hoshi star points:
  var radius = 12;
  var cur_hoshi;
  var x;
  var y;
  for (i = 0; i < hoshi.length; i++) {
    cur_hoshi = hoshi[i];
    x = (cur_hoshi[0] * space) + half_extra;
    y = (cur_hoshi[1] * space) + half_extra;
    self.result += '<circle cx="' + x + '" cy="' + y + '" r="' + radius + '" fill="' + stroke_color + '" />';
  }
  
  
  //<line x1="5" y1="5" x2="50" y2="50" stroke="gray" stroke-width="5"></line>

  //close our svg
  self.result += '</svg>';

  //console.log(self.result);
  
  return self.result;
  
}

module.exports.Grid = Grid;
