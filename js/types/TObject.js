// Copyright 2016, University of Colorado Boulder

/**
 * TObject is the root of the wrapper type hierarchy.  All wrapper types extend from TObject.
 * TObject also applies any "eager" customizations to instances immediately after they are
 * registered with PhET-iO.  The customizations are supplied via the phetioExpressions query
 * parameter or set with TPhetIO.addExpressions.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetio = require( 'PHET_IO/phetio' );

  var phetioExpressionsString = phet.phetio.queryParameters.phetioExpressions;
  var phetioExpressionsJSON = JSON.parse( phetioExpressionsString );

  /**
   * Apply a customization expression to a wrapped object.
   * @param {Object} wrapper
   * @param {function} type
   * @param {Object} phetioExpression
   */
  var applyExpression = function( wrapper, type, phetioExpression ) {
    if ( wrapper.phetioID === phetioExpression[ 0 ] ) {
      var methodName = phetioExpression[ 1 ];
      var args = phetioExpression[ 2 ];

      // Map using fromStateObject from the type method signature
      var signature = type.getMethodDeclaration( methodName );
      assert && assert( !!signature, 'Method declaration not found for ' + type.typeName + '.' + methodName );

      // Convert from JSON to objects
      var parameterTypes = signature.parameterTypes;
      assert && assert( parameterTypes, 'parameterTypes not defined' );
      assert && assert( parameterTypes.length === args.length, 'wrong number of arguments' );
      var stateObjects = [];
      for ( var k = 0; k < args.length; k++ ) {
        stateObjects.push( parameterTypes[ k ].fromStateObject( args[ k ] ) );
      }

      // phetio.setState is scheduled for after the simulation launches
      if ( wrapper.phetioID === 'phetio' && methodName === 'setState' ) {

        // IIFE to capture iteration vars
        (function( wrapper, methodName, stateObjects ) {
          phetio.simulationStartedEmitter.addListener( function() {
            wrapper[ methodName ].apply( wrapper, stateObjects );
          } );
        })( wrapper, methodName, stateObjects );
      }
      else {
        // invoke the method on the wrapper immediately after wrapper construction using the parsed/marshalled args
        wrapper[ methodName ].apply( wrapper, stateObjects );
      }
    }
  };

  /**
   * Apply all customization expressions to a newly registered simulation instance.
   *
   * @param {Object} wrapper
   * @param {function} type
   */
  var applyExpressions = function( wrapper, type ) {

    // Apply query parameters first
    for ( var i = 0; i < phetioExpressionsJSON.length; i++ ) {
      applyExpression( wrapper, type, phetioExpressionsJSON[ i ] );
    }

    // Apply values set through addExpressions
    if ( window.phetioExpressions ) {
      for ( i = 0; i < window.phetioExpressions.length; i++ ) {

        // When https://github.com/phetsims/phet-io/issues/573 is addressed, there will be no need to package as array
        var expression = [
          window.phetioExpressions[ i ].phetioID,
          window.phetioExpressions[ i ].method,
          window.phetioExpressions[ i ].args
        ];
        applyExpression( wrapper, type, expression );
      }
    }
  };

  /**
   * Main constructor for TObject base wrapper type.
   * @param {Object} instance
   * @param {string} phetioID
   * @constructor
   */
  function TObject( instance, phetioID ) {
    assert && assert( instance, 'instance should be truthy' );
    assert && assert( phetioID, 'phetioID should be truthy' );

    // @public
    this.instance = instance;

    // @public
    this.phetioID = phetioID;

    // If any query parameter calls have been made, apply them now.
    // Pass the self sub-type because this is called before the type is registered with phetio
    applyExpressions( this, this.constructor );
  }

  // TObject inherits from window.Object because it starts with its prototype in phetioInherit.inheritBase
  // However, when serialized, the TObject supertype is reported as null (not sent in the JSON).
  phetioInherit( window.Object, 'TObject', TObject, {}, {
    documentation: 'The root of the wrapper object hierarchy',

    /**
     * Decodes the object from a state, used in phetio.setState.  This should be overriden
     * by subclasses.
     * @param o
     * @returns {Object}
     */
    fromStateObject: function( o ) {
      return o;
    },

    /**
     * Defaults to reference identity, returning the phetioID of the instance.  Subclasses provide their own
     * toStateObject implementation to provide structure-based representations.
     * @param {Object} o
     * @returns {string}
     */
    toStateObject: function( o ) {
      return o === null ? 'null' :
             o === undefined ? 'undefined' :
             o.phetioID;
    },

    // Flag if type is only to be used in the data stream, and not interoperated on.
    // See phetio.getAPIForType() for more information.
    dataStreamOnlyType: false
  } );

  phetioNamespace.register( 'TObject', TObject );

  return TObject;
} );