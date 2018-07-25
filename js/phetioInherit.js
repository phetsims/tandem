// Copyright 2016, University of Colorado Boulder

/**
 * Augments PHET_CORE/inherit by adding typeName, methods, supertype and convenience methods for PhET-iO.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );

  /**
   * @param {function} supertype Constructor for the supertype.
   * @param {string} typeName - the name for the type, used for logic (such as VoidIO not needing a return, etc)
   * @param {function} subtype Constructor for the subtype. Generally should contain supertype.call( this, ... )
   * @param {Object} [methods] object containing properties that will be set on the prototype.
   * @param {Object} [staticProperties] object containing properties that will be set on the constructor function itself
   */
  var phetioInherit = function( supertype, typeName, subtype, methods, staticProperties ) {
    assert && assert( typeof typeName === 'string', 'typename must be 2nd arg' );
    assert && assert( typeName.indexOf( 'IO' ) === typeName.length - 'IO'.length, 'type name must end with IO' );
    assert && assert( typeof supertype === 'function' );

    inherit( supertype, subtype, methods, staticProperties );

    staticProperties = staticProperties || {};

    if ( staticProperties.parameterTypes ) {
      assert && assert( Array.isArray( staticProperties.parameterTypes ), 'parameterTypes expected to be array' );

      // Add the parameter types to the FunctionIO's type name.
      typeName = typeName + '.<' + staticProperties.parameterTypes.map( function( parameterType ) { return parameterType.typeName;} )
        .join( ', ' ) + '>';
    }

    // The method order is used to determine the ordering of the documentation for a type's methods, see Studio for usage.
    subtype.methodOrder = staticProperties.methodOrder || [];
    subtype.methodOrder.forEach( function( methodName ) {
      assert && assert( methods[ methodName ], 'methodName not in prototype methods: ' + methodName );
    } );

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
      else if ( typeName === 'ObjectIO' ) {
        return null;
      }
      else {
        return supertype.getMethodDeclaration( methodName );
      }
    };

    // Combine the subtype's with events from all parents into a single array, see https://github.com/phetsims/phet-io/issues/1069
    var supertypeEvents = supertype.allEvents || [];
    subtype.allEvents = supertypeEvents.concat( subtype.events || [] );
    subtype.allMethods = _.extend( {}, supertype.allMethods, methods );

    // Copy supertype's static methods to subtype, see https://github.com/phetsims/phet-io/issues/1273
    for ( var staticProperty in supertype ) {
      if ( supertype.hasOwnProperty( staticProperty ) ) {

        // If the subtype already provides the property, keep the subtype version.  If not, take the supertype property.
        if ( !subtype.hasOwnProperty( staticProperty ) ) {
          subtype[ staticProperty ] = supertype[ staticProperty ];
        }
      }
    }

    return subtype; // pass back the subtype so it can be returned immediately as a module export
  };

  phetioNamespace.register( 'phetioInherit', phetioInherit );

  return phetioInherit;
} );