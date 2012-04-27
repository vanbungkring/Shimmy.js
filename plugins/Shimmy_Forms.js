module.exports = function(Shimmy) {

  /**
   * Module Dependencies
   * attach form plugin to shimmy module
   */

  var ui = Shimmy.UI
    , _ = Shimmy._;

  ui.Form = function(params,cb) {
    //Table Styles short names
    var style = {
          grouped: Titanium.UI.iPhone.TableViewStyle.GROUPED
        , 'undefined': undefined
      }
      , fieldParams = _.groupBy(params.fields, function(fld){ return fld.section; })
      , fields = {}
      , sections = {}
      , sectionProxys = [];

      _.each(fieldParams, function(sec, key){
        //Create Form Section
        var sectionID = key.replace(/\s/g, '').toLowerCase();

        var section = ui.TableSection({id:sectionID});

        _.each(sec, function(fld){
          var input;
          var fieldID = (fld.id||fld.title||'').replace(/\s/g, '').toLowerCase();
          var row = ui.Row({title:fld.title||'', backgroundColor:'#ececec', height:50, id:fieldID});
          var leftMargin = (fld.title) ? 85 : 10;

          switch(fld.type){
            case 'textarea':
              row.proxy.height = 100;
              input = ui.TextArea({left:leftMargin, right:0, height:90, backgroundColor:'Transparent', id:fieldID, value:fld.value,hintText:fld.hint});
              break;
            case 'custom':
              row.proxy.height = fld.custom_object.proxy.height;
              input = fld.custom_object;
              break;
            case 'texfield':
              input = ui.TextField({left:leftMargin, right:0,height:50, id:fieldID ,value:fld.value,hintText:fld.hint});
              break;
            default:
              input = ui.TextField({left:leftMargin, right:0,height:50, id:fieldID ,value:fld.value,hintText:fld.hint});
              break;
          }
          //Add form field and add row to section
          fields[fieldID] = input;

          if(input.proxy.children) _.each(input.proxy.children, function(child) {
            var childFieldID = (child.id||child.name);
            fields[childFieldID] = child;
            // Form Field Event Listeners
            child.addEventListener('focus',  function(e) { self.emit( childFieldID+'.focus',  e); });
            child.addEventListener('change', function(e) { self.emit( childFieldID+'.change', e); });
            child.addEventListener('blur',   function(e) { self.emit( childFieldID+'.blur',   e); });
            child.addEventListener('click',  function(e) { self.emit( childFieldID+'.click',  e); });
          });

          input._parent = row;
          row._parent = section;
          row.add(input);
          section.add(row);

          // Form Field Event Listeners
            input.onProxy('focus',  function(e) { self.emit( fieldID+'.focus',  e); });
            input.onProxy('change', function(e) { self.emit( fieldID+'.change', e); });
            input.onProxy('blur',   function(e) { self.emit( fieldID+'.blur',   e); });
            input.onProxy('click',  function(e) { self.emit( fieldID+'.click',  e); });
        });
        //Add section to form data array
        sections[sectionID] = section;
        sectionProxys.push(section.proxy);
      });

    var self = ui.Table({
        backgroundColor:'Transparent'
      , data: sectionProxys
      , style: style[params.style]
    });



    self.fields = fields;
    self.sections = sections;
    self.isEditable = true;


    self.setHeader = function(args) {
      _.each(args, function(value, key) {
        self.sections[key].proxy.headerTitle = value;
      });
      return self;
    };


    /**
     * Set One or multiple form input values;
     * @param {Object} values [description]
     */
    self.setValues = function(values) {
      for(var key in values){
        if('object' === typeof values){
          var fieldValues = values[key];
          for(var fieldKey in fieldValues) {
            self.fields[key][fieldKey] = fieldValues[fieldKey];
          }
        } else {
          //Set Single Value
          self.fields[key].value = values[key];
        }
      }
    };

    /**
     * Editable
     * enable and disable form editing mode
     * @param  {Boolean} isEditable
     */

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

    /**
     * GetValues
     * retrieves all form fields values/data
     */

    self.getValues = function() {
      var vals = {};
      _.each(self.fields, function(field, key) {
        // Retrieves data field if set.
        // This is good if you only use the value for user display
        vals[key] = String(field.data||field.value||field.image||field.text||field.title||field.url||'');
      });
      return vals;
    };

    return self;
  };
};