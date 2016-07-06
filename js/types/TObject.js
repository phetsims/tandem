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

  var phetioExpressionsString = phet.chipper.getQueryParameter( 'phet-io.expressions' ) || '[]';
  var phetioExpressionsJSON = JSON.parse( phetioExpressionsString );

  // for instance: faradaysLaw.faradaysLawScreen.resetAllButton_setVisible_true
  // multiple args should use _ delimiter, so that multiple expressions can use , delimiter
  // for example: http://localhost/faradays-law/faradays-law_en.html?ea&brand=phet-io&phet-io.log=console&phet-io.expressions=[["beaker.beakerScreen.soluteSelector","setVisible",[true]]]
  var applyExpressions = function( instance, phetioID, wrapper ) {

    for ( var i = 0; i < phetioExpressionsJSON.length; i++ ) {
      var phetioExpression = phetioExpressionsJSON[ i ];
      if ( phetioID === phetioExpression[ 0 ] ) {
        var methodName = phetioExpression[ 1 ];
        var args = phetioExpression[ 2 ];

        // Map using fromStateObject from the type method signature
        var type = phetio.getType( phetioID );
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

        // Some actions should run after the sim starts up
        // TODO: Should this be an optional parameter to the query args, specifying whether to run lazily or eagerly?
        // TODO: Or leave this to be defined by heuristics here?
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
    }
  };

  var TObject = phetioInherit( window.Object, 'TObject', function( instance, phetioID ) {
    assert && assert( instance, 'instance should be truthy' );
    assert && assert( phetioID, 'phetioID should be truthy' );
    this.instance = instance;
    this.phetioID = phetioID;

    applyExpressions( instance, phetioID, this );
  }, {}, {
    documentation: 'The root of the wrapper object hierarchy',

    // This is used in phetio.setState
    fromStateObject: function( o ) {
      return o;
    }
  } );


  phetioNamespace.register( 'TObject', TObject );

  return TObject;
} );
