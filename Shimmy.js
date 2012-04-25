exports._ = _ =  require('/lib/underscore');
exports.EventEmitter2 = EventEmitter2 = require('/lib/EventEmitter2').EventEmitter2;

var osname = Ti.Platform.osname;

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
  this.proxy = tiElement;
}

//Wrappers for common Titanium view construction functions
Shimmy.prototype.add = function(tiChildView) {
  var v;
  if('array' === typeof tiChildView) {
    for(var x = 0; x < tiChildView.length; x++){
      v = tiChildView[x].proxy||tiChildView[x];
      this.proxy.add(v);
    }
  } else {
    v = tiChildView.proxy||tiChildView;
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

  return new Shimmy(self);
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

ui.Form = function(params,cb) {
  //Table Styles short names
  var styles = {
      grouped: Titanium.UI.iPhone.TableViewStyle.GROUPED
    , 'undefined': undefined
  };

  var fieldParams = params.fields
    , fields = {}
    , sections = [];

    fieldParams = _.groupBy(params.fields, function(fld){ return fld.section; });

    _.each(fieldParams, function(sec, key){
      //Create Form Section
      var _s = Ti.UI.createTableViewSection({name:key});

      _.each(sec, function(fld){
        var input
          , row = Ti.UI.createTableViewRow({title:fld.name, backgroundColor:'#ececec', height:50});
          row._parent = _s;

        switch(fld.type){

          case 'textarea':
            row.height = 100;
            input = Ti.UI.createTextArea({left:80, right:0,height:90, backgroundColor:'Transparent', name:fld.name, value:fld.value,hintText:fld.hint});
            break;
          //
          case 'texfield':
            input = Ti.UI.createTextField({left:80, right:0,height:50, name:fld.name,value:fld.value,hintText:fld.hint});
            break;

          default:
            input = Ti.UI.createTextField({left:80, right:0,height:50, name:fld.name,value:fld.value,hintText:fld.hint});
            break;
        }
        //Add form field and add row to section
        row.add(input);

        input._parent = row;
        fields[fld.id||fld.name] = input;
        _s.add(row);

        // Form Field Event Listeners
        input.addEventListener('focus', function(e) { self.emit((fld.id||fld.name)+'.focus', e);});
        input.addEventListener('change', function(e) { self.emit((fld.id||fld.name)+'.change',e); });
        input.addEventListener('blur', function(e) { self.emit((fld.id||fld.name)+'.blur',e); });
      });
      //Add section to form data array
      sections.push(_s);
      if (cb) cb(_s);
    });

  var self = ui('TableView',{
      backgroundColor:'Transparent'
    , data: sections
    , style: styles[params.style]
  });
  self.fields = fields;
  self.isEditable = true;

  self.setValues = function(values) {
    for(var key in values){
      if('object' === typeof values){
        var fieldValues = values[key];
        for(var fieldKey in fieldValues) {
          Ti.API.info(fieldValues[fieldKey]);
          self.fields[key][fieldKey] = fieldValues[fieldKey];
        }
      } else {
        self.fields[key].value = values[key];
      }
    }
  };

  self.editable = function(isEditable) {
    self.isEditable = isEditable;
    self.emit('mode.changed', { editable: isEditable });
    _.each(self.fields, function(field) {
      field.editable = isEditable;
      field.color = (isEditable) ? '#000000' : '#555555';
      field.enabled = isEditable;

    });
  };

  self.on('mode.change', function(e) {
    self.editable(e.editable);
  });

  self.getValues = function() {
    var vals = {};
    _.each(self.fields, function(field, key) {
      // Retrieves data field if set.
      // This is good if you only use the value for user display
      vals[key] = field.data||field.value;
    });
    return vals;
  };

  return self;
};


ui.Image = function(params) {
  var self = ui('ImageView',  _.extend({
    height:Ti.UI.SIZE,
    width:Ti.UI.SIZE
  },params||{}));

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
          Ti.API.error('Invalid type passed to ui.Window.NavButtons');
          break;
      }
   }
    return self;
  };

  return self;
};

exports.UI = ui;

//adding to public interface
exports.Shimmy = Shimmy;