// Copyright 2017-2018, University of Colorado Boulder

/**
 * Base type for instrumented PhET-iO instances, provides support for PhET-iO features when running with PhET-iO enabled.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var ObjectIO = require( 'ifphetio!PHET_IO/types/ObjectIO' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var phetioEvents = require( 'ifphetio!PHET_IO/phetioEvents' );
  var Tandem = require( 'TANDEM/Tandem' );

  var DEFAULTS = {
    tandem: Tandem.optional,        // By default tandems are optional, but subtypes can specify this as
                                    // `Tandem.tandemRequired` to enforce its presence
    phetioType: ObjectIO,           // Supply the appropriate IO type
    phetioState: true,              // When true, includes the instance in the PhET-iO state
    phetioReadOnly: false,          // When true, you can only get values from the instance; no setting allowed.
    phetioInstanceDocumentation: '' // Useful notes about an instrumented instance, shown in instance-proxies
  };

  var DEFAULT_EVENT_OPTIONS = { highFrequencyEvent: false };

  var OPTIONS_KEYS = _.keys( DEFAULTS );

  /**
   * @param {Object} [options]
   * @constructor
   */
  function PhetioObject( options ) {

    // @private {boolean} - track whether the object has been initialized.  This is necessary because initialization
    // can happen in the constructor or in a subsequent call to initializePhetioObject (to support scenery Node)
    this.phetioObjectInitialized = false;

    // @private {number|null} - tracks the index of the message to make sure ends match starts.
    // If phetioEvents.start has been called, phetioMessageIndex is a number. Otherwise it is null.
    this.phetioMessageIndex = null;

    // @private {boolean} - has the instance been disposed?
    this.phetioObjectDisposed = false;

    if ( options ) {
      this.initializePhetioObject( {}, options );
    }
  }

  tandemNamespace.register( 'PhetioObject', PhetioObject );

  return inherit( Object, PhetioObject, {

    /**
     * @param {Object} baseOptions - only applied if options keys intersect OPTIONS_KEYS
     * @param {Object} options
     * @protected
     */
    initializePhetioObject: function( baseOptions, options ) {
      assert && assert( options, 'initializePhetioObject must be called with options' );

      // TODO: garbage-free implementation
      var intersection = _.intersection( _.keys( options ), OPTIONS_KEYS );
      if ( intersection.length === 0 ) {
        return; // no PhetioObject keys provided, perhaps they will be provided in a subsequent mutate call.
      }
      assert && assert( !this.phetioObjectInitialized, 'cannot initialize twice' );
      this.phetioObjectInitialized = true;

      options = _.extend( {}, DEFAULTS, baseOptions, options );

      // @public (read-only) - the unique tandem for this instance
      // TODO: rename to this.tandem after all other this.*tandems deleted
      // TODO: do we need phetioID if we have phetioObjectTandem?
      this.phetioObjectTandem = options.tandem;

      // @private - the IO type associated with this instance
      this.phetioType = options.phetioType;

      // Register with the tandem registry
      this.phetioObjectTandem.addInstance( this, options );
    },

    /**
     * Start an event for the nested PhET-iO event stream.  Does not support re-entrant events on the same instance.
     *
     * @param {string} eventType - 'model' | 'view'
     * @param {string} event - the name of the event
     * @param {Object} [args] - arguments for the event
     * @param {Object} [options] - options for firing the event
     * @public
     */
    startEvent: function( eventType, event, args, options ) {
      assert && assert( this.phetioObjectInitialized, 'phetioObject should be initialized' );
      assert && assert( this.phetioMessageIndex === null, 'cannot start event while event is in progress' );

      // Poor-man's options for maximum performance
      options = options || DEFAULT_EVENT_OPTIONS;
      if ( window.phet && window.phet.phetio && !window.phet.phetio.queryParameters.phetioEmitHighFrequencyEvents && options.highFrequency ) {
        return;
      }

      if ( this.phetioObjectTandem.isSuppliedAndEnabled() ) {
        this.phetioMessageIndex = phetioEvents.start( eventType, this, event, args );
      }
    },

    /**
     * End an event on the nested PhET-iO event stream.
     * It this object was disposed or phetioEvents.start was not called, this is a no-op.
     * @public
     */
    endEvent: function() {

      // if this instance was disposed earlier, then the end event was already called, and should not be called again.
      // We must be able to call endEvent on disposed objects so that cases like this don't fail:
      // startEvent()
      // callbackListeners => a listener disposes the instance
      // endEvent()
      if ( this.phetioObjectDisposed ) {
        return;
      }

      if ( this.phetioObjectTandem.isSuppliedAndEnabled() ) {
        assert && assert( this.phetioMessageIndex !== null, 'cannot end an event that hasn\'t started' );
        phetioEvents.end( this.phetioMessageIndex );
        this.phetioMessageIndex = null;
      }
    },

    /**
     * Unregisters from tandem when longer used.
     * @public
     */
    dispose: function() {
      assert && assert( !this.phetioObjectDisposed, 'PhetioObject can only be disposed once' );

      // Support disposal during callback processing.
      if ( this.phetioMessageIndex !== null ) {
        this.endEvent();
      }

      // OK to dispose something that was never phetioObjectInitialized, this means it was an uninstrumented instance
      if ( this.phetioObjectInitialized ) {

        // Tandem de-registration
        this.phetioObjectTandem.removeInstance( this );
      }

      this.phetioObjectDisposed = true;
    }
  } );
} );