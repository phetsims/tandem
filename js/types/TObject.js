// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare
 */
define( function( require ) {
  'use strict';

  // modules
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetio = require( 'PHET_IO/phetio' );

  var phetioExpressionsString = phet.chipper.getQueryParameter( 'phet-io.expressions' ) || '[]';
  var phetioExpressionsJSON = JSON.parse( phetioExpressionsString );

  var applyExpression = function( instance, phetioID, wrapper, type, phetioExpression ) {
    if ( phetioID === phetioExpression[ 0 ] ) {
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
      if ( phetioID === 'phetio' && methodName === 'setState' ) {

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

  // for instance: faradaysLaw.faradaysLawScreen.resetAllButton_setVisible_true
  // multiple args should use _ delimiter, so that multiple expressions can use , delimiter
  // for example: http://localhost/faradays-law/faradays-law_en.html?ea&brand=phet-io&phet-io.log=console&phet-io.expressions=[["beaker.beakerScreen.soluteSelector","setVisible",[true]]]
  // TODO: this implementation may belong elsewhere, and perhaps should be applied at a different point in time.
  var applyExpressions = function( instance, phetioID, wrapper, type ) {

    // Apply query parameters first
    for ( var i = 0; i < phetioExpressionsJSON.length; i++ ) {
      applyExpression( instance, phetioID, wrapper, type, phetioExpressionsJSON[ i ] );
    }

    // Apply values set through addExpressions
    if ( window.phetioExpressions ) {
      for ( i = 0; i < window.phetioExpressions.length; i++ ) {

        // TODO: When https://github.com/phetsims/phet-io/issues/573 is addressed, there will be no need to package as
        // an array
        var expression = [
          window.phetioExpressions[ i ].phetioID,
          window.phetioExpressions[ i ].method,
          window.phetioExpressions[ i ].args
        ];
        applyExpression( instance, phetioID, wrapper, type, expression );
      }
    }
  };

  // TObject inherits from window.Object because it starts with its prototype in phetioInherit.inheritBase
  // However, when serialized, the TObject supertype is reported as null (not sent in the JSON).
  function TObject( instance, phetioID ) {
    assert && assert( instance, 'instance should be truthy' );
    assert && assert( phetioID, 'phetioID should be truthy' );

    // @public
    this.instance = instance;

    // @public
    this.phetioID = phetioID;

    // If any query parameter calls have been made, apply them now.
    // Pass the self sub-type because this is called before the type is registered with phetio
    applyExpressions( instance, phetioID, this, this.constructor );
  }

  phetioInherit( window.Object, 'TObject', TObject, {}, {
    documentation: 'The root of the wrapper object hierarchy',

    // This is used in phetio.setState
    fromStateObject: function( o ) {
      return o;
    }
  } );

  phetioNamespace.register( 'TObject', TObject );

  return TObject;
} );