var _ = exports._ =  require('/Shimmy/timo_modules/underscore');
var EventEmitter2 = exports.EventEmitter2 = require('/Shimmy/timo_modules/EventEmitter2').EventEmitter2;

var osname = exports.osname = Ti.Platform.osname;

/*
 * Wrapper for Titanium UI components.  This wrapper provides a few pieces of critical
 * functionality, currently missing from Titanium UI objects:
 * - The ability to safely extend components with new members
 * - Rudimentary resource management and object lifecycle handling
 * Extended and modified from Shimmys in the Ti Community app
 */

/**
 * Main Proxy Wrapper
 */

Shimmy.prototype = new EventEmitter2({
      wildcard: true  // should the event emitter use wildcards.
    , maxListeners: 20 // the max number of listeners that can be assigned to an event, defaults to 10.
});
Shimmy.prototype.constructor = Shimmy;


function Shimmy(tiElement) {
  var self = this;
  self.children = [];
  self.proxy = tiElement;
}

//Wrappers for common Titanium view construction functions
Shimmy.prototype.add = function(tiChildView) {
  var v;
  if('array' === typeof tiChildView) {
    for(var x = 0; x < tiChildView.length; x++){
      v = tiChildView[x].proxy||tiChildView[x];
      tiChildView[x]._parent = this;
      this.proxy.add(v);
    }
  } else {
    v = tiChildView.proxy||tiChildView;
    v._parent = this;
      tiChildView._parent = this;
    this.proxy.add(v);
  }
  return this;
};

Shimmy.prototype.remove = function(tiChildView) {
  var v = tiChildView.proxy||tiChildView;
  this.proxy.remove(v);
  return this;
};

Shimmy.prototype.open = function(args) {
  if (this.proxy.open) {
    this.proxy.open(args||{animated:false});
  }
  return this;
};

Shimmy.prototype.close = function(args) {
  if (this.proxy.close) {
    this.proxy.close(args||{animated:false});
  }
  return this;
};

Shimmy.prototype.animate = function(args,callback) {
  this.proxy.animate(args,callback||function(){});
  return this;
};

Shimmy.prototype.updateLayout = function(args, cb) {
  this.proxy.updateLayout(args);
  return this;
};

//Getter/Setter for the wrapped Titanium view proxy object
Shimmy.prototype.get = function(key) {
  return this.proxy[key];
};

Shimmy.prototype.set = function(key,value) {
  if ('object' === typeof key) this.proxy.updateLayout(key);
  this.proxy[key] = value;
  return this;
};

//Event Handling
Shimmy.prototype.onProxy = function(event,callback) {
  switch (event) {
    case 'location':
      this.globalHandlers.location = callback;
      Ti.Geolocation.addEventListener('location', this.globalHandlers.location);
      break;
    case 'orientationchange':
      this.globalHandlers.orientationchange = callback;
      Ti.Gesture.addEventListener('orientationchange', this.globalHandlers.orientationchange);
      break;
    default:
      this.proxy.addEventListener(event,callback);
      break;
  }
};
Shimmy.prototype.emitProxy = function(event,data) {
  this.proxy.fireEvent(event,data||{});
};

//This should be overridden by any Shimmys which wish to execute custom
//clean up logic, to release their child components, etc.
Shimmy.prototype.onDestroy = function() {};

//Clean up resources used by this Shimmy
Shimmy.prototype.release = function() {
  //force cleanup on proxy
  this.proxy = null;

  //run custom cleanup logic
  this.onDestroy();
};

/**
 * UI Specific Functions
 */

function ui(tiElement, args){
  var self;
  if ('object' === typeof tiElement) {
    self = tiElement;
  } else {
    self = (args && args.platform) ? Ti.UI[args.platform]['create'+tiElement](args||{}) : Ti.UI['create'+tiElement](args||{});
  }

  var shimmyObject = new Shimmy(self);

  var _v = (args && args.valueField) ? args.valueField : 'value';

  Object.defineProperty(shimmyObject, 'value', {
      get : function() { return shimmyObject.proxy.value; }
    , set : function(val) { this.value = fshimmyObject.proxy.value = val; }
    , configurable: true
  });

  return shimmyObject;
}

ui.Button = function (params) {
  var self = ui('Button', params);

  Object.defineProperty(self, 'title',{
    get: function() {
      return self.proxy.title;
    },
    set: function(btnTitle) {
      self.proxy.title = btnTitle;
    }
  });

  return self;
};

ui.ButtonBar = function(params) {
  var self = ui('View', params);
  return self;
};

ui.CoverFlow = function(params) {
  var self = ui('CoverFlowView', params);
  return self;
};

ui.DashIcon = function(params) {
  var self = ui('DashboardItem', params);
  return self;
};

ui.DashBoard = function(params) {
  var self = ui('DashboardView', params);
  return self;
};

ui.EmailDialog = function(params) {
  var self = ui('EmailDialog', params);
  return self;
};

ui.Image = function(params) {
  var self = ui('ImageView',  _.extend({
    height:Ti.UI.SIZE,
    width:Ti.UI.SIZE,
    valueField:'image'
  },params||{}));

  Object.defineProperty(self, 'value', {
      get : function() { return this.proxy.image; }
    , set : function(val) { self.proxy.image = val; }
  });

  self.value = params.image;
  return self;
};

ui.Label = function(params) {
  var self = ui('Label',_.extend({
    text:params.text,
    color:'#000',
    height:20,
    width:Ti.UI.SIZE,
    font: {
      fontFamily: (osname === 'android') ? 'Droid Sans' : 'Helvetica Neue',
      fontSize: 14
    }
  },params||{}));
  return self;
};

ui.NavGroup = function(params) {
  //Hard coded platform until Android and Mobile Web NavigationGroup shim is made
  params.platform = 'iPhone';
  params.window = params.window.proxy;
  var self = ui('NavigationGroup',params);

  self.open = function(win, params) {
    self.proxy.open(win.proxy,params);
  };
  return self;
};

ui.OptionDialog = function(params) {
  var self = ui('OptionDialog', params);
  return self;
};

ui.Picker = function(params) {
  var self = ui('Picker', params);
  return self;
};

ui.Row = function(params) {
  var self = ui('TableViewRow', params);
  return self;
};

ui.ScrollableView = function(params) {
  var self = ui('OptionDialog', params);
  return self;
};

ui.ScrollView = function(params) {
  var self = ui('ScrollView', params);
  return self;
};

ui.TabGroup = function(params) {
  var tabs = params.tabs;

  delete params.tabs;

  var self = ui('TabGroup', params);

  function next(i) {
    var tab = Ti.UI.createTab({
        icon:tabs[i].icon,
        title:tabs[i].title,
        window: tabs[i].window
    });
    self.proxy.addTab(tab);
    if (i < tabs.length -1) next(i+1);
  }
  next(0);

  return self;
};

ui.Table = function(args) {
  var self = ui('TableView', args);

  self.empty = function() {
    self.proxy.setData();
    return self;
  };

  self.setData = function(data) {
    self.proxy.setData(data);
    return self;
  };

  self.appendRow = function(row) {
    var r = row.proxy||row;
    self.proxy.appendRow(r);
    return self;
  };

  return self;
};

ui.TableSection = function(params) {
  var self = ui('TableViewSection', params);
  return self;
};

ui.TextArea = function(params) {
  var self = ui('TextArea', params);
  return self;
};

ui.TextField = function(params) {
  var self = ui('TextField', params);
  return self;
};

ui.Toolbar = function(params) {
  var self = ui('Toolbar', params);
  return self;
};

ui.View = function(params) {
  var self = ui('View', params);
  return self;
};

ui.WebView = function(params) {
  var self = ui('WebView', params);
  return self;
};

ui.Window = function(params) {
  var self = ui('Window', params);

  self.NavButtons = function(params) {
   for(var x in params){
      switch(typeof params[x]) {
        case 'string':
        case 'number':
          self[x+'NavButton'] = ui.Button({title:params[x]});
          self.proxy[x+'NavButton'] = self[x+'NavButton'].proxy;
          break;
        case 'object':
          self[x+'NavButton'] = params[x];
          self.proxy[x+'NavButton'] = self[x+'NavButton'].proxy;
          break;
        default:
          break;
      }
   }
    // Return self to allow for chaining
    return self;
  };

  return self;
};

exports.UI = ui;

//adding to public interface
exports.Shimmy = Shimmy;