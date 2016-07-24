// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
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

    inherit( supertype, subtype, prototypeMethods, staticProperties );

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

    return subtype; // pass back the subtype so it can be returned immediately as a module export
  };

  phetioNamespace.register( 'phetioInherit', phetioInherit );

  return phetioInherit;
} );