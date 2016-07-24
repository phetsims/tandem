// Copyright 2016, University of Colorado Boulder

/**
 * Subclass decorator for AXON/Emitter that supplies (mandatory) Tandem registration.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Emitter = require( 'AXON/Emitter' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var Tandem = require( 'TANDEM/Tandem' );

  // phet-io modules
  var TTandemEmitter = require( 'PHET_IO/types/tandem/axon/TTandemEmitter' );

  /**
   * @param {Object} [options]
   * @constructor
   */
  function TandemEmitter( options ) {
    options = _.extend( {
      argTypes: null,
      tandem: null
    }, options );

    Tandem.validateOptions( options ); // The tandem is required when brand==='phet-io'

    Emitter.call( this );

    // @private (phet-io)
    this.callbacksStartedEmitter = new Emitter();
    this.callbacksEndedEmitter = new Emitter();

    // Tandem registration
    TTandemEmitter && options.tandem.addInstance( this, TTandemEmitter( options.argTypes ) );

    // @private
    this.disposeTandemEmitter = function() {

      // Tandem de-registration
      options.tandem.removeInstance( this );
    };
  }

  tandemNamespace.register( 'TandemEmitter', TandemEmitter );

  return inherit( Emitter, TandemEmitter, {

    // @public @override
    emit: function() {
      this.callbacksStartedEmitter && this.callbacksStartedEmitter.emit();
      Emitter.prototype.emit.call( this );
      this.callbacksEndedEmitter && this.callbacksEndedEmitter.emit();
    },

    // @public @override
    emit1: function( arg ) {
      this.callbacksStartedEmitter && this.callbacksStartedEmitter.emit1( arg );
      Emitter.prototype.emit1.call( this, arg );
      this.callbacksEndedEmitter && this.callbacksEndedEmitter.emit();
    },

    // @public @override
    emit2: function( arg1, arg2 ) {
      this.callbacksStartedEmitter && this.callbacksStartedEmitter.emit2( arg1, arg2 );
      Emitter.prototype.emit2.call( this, arg1, arg2 );
      this.callbacksEndedEmitter && this.callbacksEndedEmitter.emit();
    },

    // @public
    dispose: function() {
      this.disposeTandemEmitter();
    }
  } );
} );