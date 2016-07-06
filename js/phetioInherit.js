// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare
 */
define( function( require ) {
  'use strict';

  // modules
  var extend = require( 'PHET_CORE/extend' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );

  /**
   * Clone a function and all its properties, used in inheritance to make sure api additions through extend
   * don't apply across types.  See #281
   * @param {function} parentFunction
   * @returns {clone}
   */
  var cloneFunction = function( parentFunction ) {
    var clone = function() {
      return parentFunction.apply( this, arguments );
    };
    for ( var key in this ) {
      if ( this.hasOwnProperty( key ) ) {
        clone[ key ] = this[ key ];
      }
    }
    return clone;
  };

  /**
   * Private inherit function (without extend function), used for creating extendable types.
   * See phetioInherit
   * @param {function} supertype - Constructor for the supertype.
   * @param {string} typeName - The name of the type
   * @param {function} subtype - Constructor for the subtype. Generally should contain supertype.call( this, ... )
   * @param {Object} methods - [optional] object containing instance methods, with {returnType, parameterTypes, documentation, implementation}
   * @param {Object} staticProperties - [optional] object containing properties that will be set on the constructor function itself
   * @private
   */
  var inheritBase = function( supertype, typeName, subtype, methods, staticProperties ) {
    assert && assert( typeof supertype === 'function' );

    // Copy implementations to the prototype for ease of use, see #185
    var prototypeMethods = {};
    for ( var method in methods ) {
      if ( methods.hasOwnProperty( method ) ) {
        prototypeMethods[ method ] = methods[ method ].implementation;
      }
    }

    function F() {}

    F.prototype = supertype.prototype; // so new F().__proto__ === supertype.prototype

    subtype.prototype = extend( // extend will combine the properties and constructor into the new F copy
      new F(), // so new F().__proto__ === supertype.prototype, and the prototype chain is set up nicely
      { constructor: subtype }, // overrides the constructor properly
      prototypeMethods // [optional] additional properties for the prototype, as an object.
    );

    //Copy the static properties onto the subtype constructor so they can be accessed 'statically'
    extend( subtype, staticProperties );

    // Include the supertype's API within our subtype's API, so that we can create the key entries directly on the
    // subtype.
    subtype.api = extend( {}, supertype.api, subtype.api );

    // Copy any static API entries directly to the object, so they can be traversed for type lookup (like for TGroup)
    var keys = _.keys( subtype.api );
    for ( var i = 0; i < keys.length; i++ ) {
      var key = keys[ i ];

      assert && assert( typeof subtype[ key ] === 'undefined', 'name collision in static api assignment' );
      subtype[ key ] = subtype.api[ key ];
    }

    subtype.typeName = typeName;
    subtype.methods = methods;
    subtype.supertype = supertype;

    /**
     * Look through the inheritance hierarchy to find the deepest (subtypiest) method declaration
     */
    subtype.getMethodDeclaration = function( methodName ) {
      if ( this.methods[ methodName ] ) {
        return this.methods[ methodName ];
      }
      else if ( typeName === 'TObject' ) {
        return null;
      }
      else {
        return supertype.getMethodDeclaration( methodName );
      }
    };

    subtype.allMethods = _.extend( {}, supertype.allMethods, methods );

    // TODO: It would be so nice to abandon this parallel type definition and use actual instanceof etc.
    // TODO: Can this be implemented without a name check?  The name check seems susceptible to false positives.
    subtype.hasType = function( type ) {
      return !!( subtype.typeName === type.typeName || ( supertype && supertype.hasType && supertype.hasType( type ) ) );
    };

    return subtype; // pass back the subtype so it can be returned immediately as a module export
  };

  /**
   * @param {function} supertype Constructor for the supertype.
   * @param {string} typeName - the name for the type, used for logic (such as TVoid not needing a return, etc)
   * @param {function} subtype Constructor for the subtype. Generally should contain supertype.call( this, ... )
   * @param {Object} [methods] object containing properties that will be set on the prototype.
   * @param {Object} [staticProperties] object containing properties that will be set on the constructor function itself
   */
  var phetioInherit = function( supertype, typeName, subtype, methods, staticProperties ) {
    assert && assert( typeof typeName === 'string', 'typename must be 2nd arg' );

    var type = inheritBase( supertype, typeName, cloneFunction( subtype ), methods, staticProperties );

    // Make it possible to declare types like this:
    // myInstance: MyType.extend({
    //  childInstance: childType
    // })
    type.extend = function( api ) {
      var typeCopy = inheritBase( supertype, typeName, cloneFunction( subtype ), methods, staticProperties );
      var keys = _.keys( api );
      for ( var i = 0; i < keys.length; i++ ) {
        var key = keys[ i ];
        typeCopy[ key ] = api[ key ];
      }
      typeCopy.phetioAPIKeys = keys;
      return typeCopy;
    };
    return type; // pass back the subtype so it can be returned immediately as a module export
  };

  phetioNamespace.register( 'phetioInherit', phetioInherit );

  return phetioInherit;
} );
