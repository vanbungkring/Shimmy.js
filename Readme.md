#Shimmy

Titanium Mobile Proxy wrapper that for extending native Titanium Elements, adding Wildcard and Namespaced Event Listeners.
Shims for platform independent code
Helpers for smarter faster code

## Getting Started

Include Shimmy in your Titanium Project. Shimmy comes packaged with Underscore and EventEmitter2 so you can use them as well.

```javascript
var shimmy = require('/Shimmy')
  , ui = shimmy.UI
  ,  _ = shimmy._;
```

## UI

### Forms

Create a new Form

```javascript
var form = ui.Form({
    style: 'grouped' //Set Form/Table Style
  , fields: [ //Input type defaults to textfield
       { name: 'Title',   section: 'title',    hint: 'Event Name',        value: '', id:'title' }
     , { name: 'Start',   section: 'duration', hint: 'Start Time',        value: '' }
     , { name: 'End',     section: 'duration', hint: 'End Time',          value: '' }
     , { name: 'Repeat',  section: 'duration', hint: 'Repeat',            value: '' }
     , { name: 'Notes',   section: 'notes',    hint: 'Additional Notes',  value: '', type:'textarea' }
    ]
});
```

Listening for Form Field Events

form.on('Title.focus', function(e){ alert(e.source); });
form.on('Title.change', function(e){ alert(e.source); });
form.on('Title.blur', function(e){ alert(e.source); });

Batch updates of Form Fields and other field attributes

```javascript
form.setValues({Title:{ value:'Awesome', data:'HIDDENDATA'} });
```

Access Individual Form Fields

```javascript
//Field Accessors default to name value if no id is set
form.fields.title.value = 'newvalue';
```

Form Table Proxy Event Listeners

```javascript
form.onProxy('click', function(e) {

  // Get Form Values
  var formVals = form.getValues();

  alert(formVals);
});
```

## TODO

- Finish writing docs
- Add more shims and helpers