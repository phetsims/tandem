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
   * @param {function} supertype Constructor for the supertype.
   * @param {string} typeName - the name for the type, used for logic (such as TVoid not needing a return, etc)
   * @param {function} subtype Constructor for the subtype. Generally should contain supertype.call( this, ... )
   * @param {Object} [methods] object containing properties that will be set on the prototype.
   * @param {Object} [staticProperties] object containing properties that will be set on the constructor function itself
   */
  var phetioInherit = function( supertype, typeName, subtype, methods, staticProperties ) {
    assert && assert( typeof typeName === 'string', 'typename must be 2nd arg' );
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

  phetioNamespace.register( 'phetioInherit', phetioInherit );

  return phetioInherit;
} );
