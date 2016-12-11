// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var assertInstanceOf = require( 'PHET_IO/assertions/assertInstanceOf' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var TObject = require( 'PHET_IO/types/TObject' );
  var phetioEvents = require( 'PHET_IO/phetioEvents' );
  var TVoid = require( 'PHET_IO/types/TVoid' );
  var TFunctionWrapper = require( 'PHET_IO/types/TFunctionWrapper' );

  /**
   * Wrapper type for phet/tandem's TandemEmitter class.
   * Emitter for 0, 1 or 2 args
   * @param {function[]} phetioArgumentTypes
   * @returns {TTandemEmitterImpl}
   * @constructor
   */
  function TTandemEmitter( phetioArgumentTypes ) {
    assert && assert( phetioArgumentTypes, 'phetioArgumentTypes should be defined' );
    return phetioInherit( TObject, 'TTandemEmitter', function TTandemEmitterImpl( tandemEmitter, phetioID ) {

      TObject.call( this, tandemEmitter, phetioID );
      assertInstanceOf( tandemEmitter, phet.tandem.TandemEmitter );

      var messageIndex = null;

      // Allow certain Emitters to suppress their data output, such as the frameCompletedEmitter
      if ( tandemEmitter.phetioEmitData ) {
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
      }
    }, {
      addListener: {
        returnType: TVoid,
        parameterTypes: [ TFunctionWrapper( TVoid, phetioArgumentTypes ) ],
        implementation: function( listener ) {
          this.instance.addListener( listener );
        },
        documentation: 'Add a listener which will be called when the emitter emits.'
      }
    }, {
      documentation: 'Emitters indicate when events have occurred, with optional arguments describing the event',
      events: [ 'emitted' ]
    } );
  }

  phetioNamespace.register( 'TTandemEmitter', TTandemEmitter );

  return TTandemEmitter;
} );
