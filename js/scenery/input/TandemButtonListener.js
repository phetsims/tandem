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
    var tandemButtonListener = this;

    this.startedCallbacksForOverEmitter = new Emitter();
    this.endedCallbacksForOverEmitter = new Emitter();

    options = _.extend( { tandem: null }, options );

    // Intercept calls to up/over/down/out/fire and augment with a phet-io compatible emitter event.
    // Clone the options so that we can refer to the original implementations in the
    // augmented callbacks
    var optionsCopy = _.clone( options );

    // Wrap start/end/drag options (even if they did not exist) to get the PhET-iO instrumentation.
    optionsCopy.over = function( event, trail ) {
      tandemButtonListener.startedCallbacksForOverEmitter.emit();
      options.over && options.over( event, trail );
      tandemButtonListener.endedCallbacksForOverEmitter.emit();
    };

    ButtonListener.call( this, optionsCopy );

    options.tandem && options.tandem.addInstance( this );
  }

  tandemNamespace.register( 'TandemButtonListener', TandemButtonListener );

  return inherit( ButtonListener, TandemButtonListener );
} );