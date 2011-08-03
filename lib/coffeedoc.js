(function() {
  /*
  Documentation functions
  =======================
  These functions extract relevant documentation info from AST nodes as returned
  by the coffeescript parser.
  */  var coffeescript, documentClass, documentFunction, getFullName, removeLeadingWhitespace;
  coffeescript = require('coffee-script');
  exports.documentModule = function(script, parser) {
    /*
        Given a module's source code and an AST parser, returns module information
        in the form:
    
            {
                "docstring": "Module docstring",
                "classes": [class1, class1...],
                "functions": [func1, func2...]
            }
    
        AST parsers are defined in the `parsers.coffee` module
        */    var c, doc, docstring, f, first_obj, nodes;
    nodes = parser.getNodes(coffeescript.nodes(script));
    first_obj = nodes[0];
    if ((first_obj != null ? first_obj.type : void 0) === 'Comment') {
      docstring = removeLeadingWhitespace(first_obj.comment);
    } else {
      docstring = null;
    }
    doc = {
      docstring: docstring,
      deps: parser.getDependencies(nodes),
      classes: (function() {
        var _i, _len, _ref, _results;
        _ref = parser.getClasses(nodes);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          c = _ref[_i];
          _results.push(documentClass(c));
        }
        return _results;
      })(),
      functions: (function() {
        var _i, _len, _ref, _results;
        _ref = parser.getFunctions(nodes);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          f = _ref[_i];
          _results.push(documentFunction(f));
        }
        return _results;
      })()
    };
    return doc;
  };
  getFullName = function(variable) {
    /*
        Given a variable node, returns its full name
        */    var name, p;
    name = variable.base.value;
    if (variable.properties.length > 0) {
      name += '.' + ((function() {
        var _i, _len, _ref, _results;
        _ref = variable.properties;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          p = _ref[_i];
          _results.push(p.name.value);
        }
        return _results;
      })()).join('.');
    }
    return name;
  };
  documentClass = function(cls) {
    /*
        Evaluates a class object as returned by the coffeescript parser, returning
        an object of the form:
        
            {
                "name": "MyClass",
                "docstring": "First comment following the class definition"
                "parent": "MySuperClass",
                "methods": [method1, method2...]
            }
        */    var doc, docstring, emptyclass, first_obj, m, methods, n, parent, _ref, _ref2;
    if (cls.type === 'Assign') {
      cls = cls.value;
    }
    emptyclass = !(((_ref = cls.body.expressions[0]) != null ? _ref.base : void 0) != null);
    first_obj = emptyclass ? cls.body.expressions[0] : (_ref2 = cls.body.expressions[0].base) != null ? _ref2.objects[0] : void 0;
    if ((first_obj != null ? first_obj.type : void 0) === 'Comment') {
      docstring = removeLeadingWhitespace(first_obj.comment);
    } else {
      docstring = null;
    }
    methods = emptyclass ? [] : (function() {
      var _i, _len, _ref3, _results;
      _ref3 = cls.body.expressions[0].base.objects;
      _results = [];
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        n = _ref3[_i];
        if (n.type === 'Assign' && n.value.type === 'Code') {
          _results.push(n);
        }
      }
      return _results;
    })();
    if (cls.parent != null) {
      parent = getFullName(cls.parent);
    } else {
      parent = null;
    }
    doc = {
      name: getFullName(cls.variable),
      docstring: docstring,
      parent: parent,
      methods: (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = methods.length; _i < _len; _i++) {
          m = methods[_i];
          _results.push(documentFunction(m));
        }
        return _results;
      })()
    };
    return doc;
  };
  documentFunction = function(func) {
    /*
        Evaluates a function object as returned by the coffeescript parser,
        returning an object of the form:
        
            {
                "name": "myFunc",
                "docstring": "First comment following the function definition",
                "params": ["param1", "param2"...]
            }
        */    var doc, docstring, first_obj, p, params;
    first_obj = func.value.body.expressions[0];
    if (first_obj != null ? first_obj.comment : void 0) {
      docstring = removeLeadingWhitespace(first_obj.comment);
    } else {
      docstring = null;
    }
    if (func.value.params) {
      params = (function() {
        var _i, _len, _ref, _results;
        _ref = func.value.params;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          p = _ref[_i];
          _results.push(p.splat ? p.name.value + '...' : p.name.value);
        }
        return _results;
      })();
    } else {
      params = [];
    }
    return doc = {
      name: getFullName(func.variable),
      docstring: docstring,
      params: params
    };
  };
  removeLeadingWhitespace = function(str) {
    /*
        Given a string, returns it with leading whitespace removed but with
        indentation preserved
        */    var indentation, leading_whitespace, line, lines;
    lines = str.split('\n');
    while (/^ *$/.test(lines[0])) {
      lines.shift();
    }
    if (lines.length === 0) {
      return null;
    }
    indentation = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = lines.length; _i < _len; _i++) {
        line = lines[_i];
        if (/^ *$/.test(line)) {
          continue;
        }
        _results.push(line.match(/^ */)[0].length);
      }
      return _results;
    })();
    indentation = Math.min.apply(Math, indentation);
    leading_whitespace = new RegExp("^ {" + indentation + "}");
    return ((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = lines.length; _i < _len; _i++) {
        line = lines[_i];
        _results.push(line.replace(leading_whitespace, ''));
      }
      return _results;
    })()).join('\n');
  };
}).call(this);