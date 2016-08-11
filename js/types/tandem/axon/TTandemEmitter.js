// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare
 */
define( function( require ) {
  'use strict';

  // modules
  var assertInstanceOf = require( 'PHET_IO/assertions/assertInstanceOf' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var TObject = require( 'PHET_IO/types/TObject' );
  var phetioEvents = require( 'PHET_IO/phetioEvents' );

  // Emitter for 0, 1 or 2 args
  var TTandemEmitter = function( phetioArgumentTypes ) {
    assert && assert( phetioArgumentTypes, 'phetioArgumentTypes should be defined' );
    return phetioInherit( TObject, 'TTandemEmitter', function( tandemEmitter, phetioID ) {

      TObject.call( this, tandemEmitter, phetioID );
      assertInstanceOf( tandemEmitter, phet.tandem.TandemEmitter );

      var messageIndex = null;

      tandemEmitter.callbacksStartedEmitter.addListener( function() {
        assert && assert( arguments.length === phetioArgumentTypes.length, 'Wrong number of arguments, expected ' + phetioArgumentTypes.length + ', received ' + arguments.length );
        var p = [];
        for ( var i = 0; i < arguments.length; i++ ) {
          var a = arguments[ i ];
          p.push( a );
        }
        var parameters = { arguments: p };
        messageIndex = phetioEvents.start( 'model', phetioID, TTandemEmitter( phetioArgumentTypes ), 'emitted', parameters );
      } );

      tandemEmitter.callbacksEndedEmitter.addListener( function() {
        assert && assert( arguments.length === 0, 'Wrong number of arguments, expected ' + phetioArgumentTypes.length + ', received ' + arguments.length );
        messageIndex && phetioEvents.end( messageIndex );
      } );
    }, {}, {
      documentation: 'Emitters indicate when events have occurred, with optional arguments describing the event',
      events: [ 'emitted' ]
    } );
  };

  phetioNamespace.register( 'TTandemEmitter', TTandemEmitter );

  return TTandemEmitter;
} );
