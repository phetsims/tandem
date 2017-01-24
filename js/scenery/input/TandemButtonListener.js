// Copyright 2016, University of Colorado Boulder

/**
 * This tandem wrapper for scenery's ButtonListener (*not* SUN/ButtonListener) emits messages for up/over/down/out/fire.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var ButtonListener = require( 'SCENERY/input/ButtonListener' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var Emitter = require( 'AXON/Emitter' );
  var Tandem = require( 'TANDEM/Tandem' );

  // phet-io modules
  var TTandemButtonListener = require( 'ifphetio!PHET_IO/types/scenery/input/TTandemButtonListener' );

  /**
   * up: null          // Called on an 'up' state change, as up( event, oldState )
   * over: null        // Called on an 'over' state change, as over( event, oldState )
   * down: null        // Called on an 'down' state change, as down( event, oldState )
   * out: null         // Called on an 'out' state change, as out( event, oldState )
   * fire: null
   * @param options
   * @constructor
   */
  function TandemButtonListener( options ) {
    var self = this;

    options = _.extend( { tandem: Tandem.tandemRequired() }, options );

    this.startedCallbacksForUpEmitter = new Emitter();
    this.endedCallbacksForUpEmitter = new Emitter();

    this.startedCallbacksForOverEmitter = new Emitter();
    this.endedCallbacksForOverEmitter = new Emitter();

    this.startedCallbacksForDownEmitter = new Emitter();
    this.endedCallbacksForDownEmitter = new Emitter();

    this.startedCallbacksForOutEmitter = new Emitter();
    this.endedCallbacksForOutEmitter = new Emitter();

    this.startedCallbacksForFireEmitter = new Emitter();
    this.endedCallbacksForFireEmitter = new Emitter();

    // Intercept calls to up/over/down/out/fire and augment with a phet-io compatible emitter event.
    // Clone the options so that we can refer to the original implementations in the
    // augmented callbacks
    var optionsCopy = _.clone( options );

    // Wrap start/end/drag options (even if they did not exist) to get the PhET-iO instrumentation.
    optionsCopy.up = function( event, trail ) {
      self.startedCallbacksForUpEmitter.emit();
      options.up && options.up( event, trail );
      self.endedCallbacksForUpEmitter.emit();
    };
    optionsCopy.over = function( event, trail ) {
      self.startedCallbacksForOverEmitter.emit();
      options.over && options.over( event, trail );
      self.endedCallbacksForOverEmitter.emit();
    };
    optionsCopy.down = function( event, trail ) {
      self.startedCallbacksForDownEmitter.emit();
      options.down && options.down( event, trail );
      self.endedCallbacksForDownEmitter.emit();
    };
    optionsCopy.out = function( event, trail ) {
      self.startedCallbacksForOutEmitter.emit();
      options.out && options.out( event, trail );
      self.endedCallbacksForOutEmitter.emit();
    };
    optionsCopy.fire = function( event, trail ) {
      self.startedCallbacksForFireEmitter.emit();
      options.fire && options.fire( event, trail );
      self.endedCallbacksForFireEmitter.emit();
    };

    ButtonListener.call( this, optionsCopy );

    options.tandem && options.tandem.addInstance( this, TTandemButtonListener );
  }

  tandemNamespace.register( 'TandemButtonListener', TandemButtonListener );

  return inherit( ButtonListener, TandemButtonListener );
} );