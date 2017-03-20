// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var assertInstanceOf = require( 'ifphetio!PHET_IO/assertions/assertInstanceOf' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var TObject = require( 'ifphetio!PHET_IO/types/TObject' );
  var phetioEvents = require( 'ifphetio!PHET_IO/phetioEvents' );
  var TVoid = require( 'ifphetio!PHET_IO/types/TVoid' );
  var TFunctionWrapper = require( 'ifphetio!PHET_IO/types/TFunctionWrapper' );

  /**
   * Wrapper type for phet/tandem's TandemEmitter class.
   * Emitter for 0, 1 or 2 args
   * @param {function[]} phetioArgumentTypes - If loaded by phet (not phet-io), the array will be of functions
   *                                          returned by the 'ifphetio!' plugin.
   * @returns {TTandemEmitterImpl}
   * @constructor
   */
  function TTandemEmitter( phetioArgumentTypes ) {

    var TTandemEmitterImpl = function TTandemEmitterImpl( tandemEmitter, phetioID ) {
      assert && assert( phetioArgumentTypes, 'phetioArgumentTypes should be defined' );

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
    };

    return phetioInherit( TObject, 'TTandemEmitter', TTandemEmitterImpl, {
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

  tandemNamespace.register( 'TTandemEmitter', TTandemEmitter );

  return TTandemEmitter;
} );

