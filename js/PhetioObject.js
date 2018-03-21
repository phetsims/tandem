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
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var Tandem = require( 'TANDEM/Tandem' );

  // phet-io modules
  var ObjectIO = require( 'ifphetio!PHET_IO/types/ObjectIO' );
  var phetioEvents = require( 'ifphetio!PHET_IO/phetioEvents' );

  // constants
  var PHET_IO_ENABLED = !!( window.phet && window.phet.phetio );

  // Flag that indicates a high frequency message was skipped.
  var SKIPPING_HIGH_FREQUENCY_MESSAGE = -1;

  var DEFAULTS = {
    tandem: Tandem.optional,        // By default tandems are optional, but subtypes can specify this as
                                    // `Tandem.tandemRequired` to enforce its presence
    phetioType: ObjectIO,           // Supply the appropriate IO type
    phetioState: true,              // When true, includes the instance in the PhET-iO state
    phetioReadOnly: false,          // When true, you can only get values from the instance; no setting allowed.
    phetioInstanceDocumentation: '' // Useful notes about an instrumented instance, shown in the PhET-iO Studio Wrapper
  };

  var DEFAULT_EVENT_OPTIONS = { highFrequencyEvent: false };

  var OPTIONS_KEYS = _.keys( DEFAULTS );

  /**
   * @param {Object} [options]
   * @constructor
   */
  function PhetioObject( options ) {

    // @public (read-only) {Tandem} - assigned in initializePhetioObject - the unique tandem for this instance
    this.tandem = null;

    // @public (read-only) {IOType} - assigned in initializePhetioObject - the IO type associated with this instance
    this.phetioType = null;

    // @public (read-only) {boolean} - assigned in initializePhetioObject - When true, included in the PhET-iO state
    this.phetioState = null;

    // @public (read-only) {boolean} - assigned in initializePhetioObject - When true, values can be get but not set
    this.phetioReadOnly = null;

    // @public (read-only) {string} - assigned in initializePhetioObject - Notes about an instance, shown in the PhET-iO Studio Wrapper
    this.phetioInstanceDocumentation = null;

    // @public (read-only) {Object} - assigned in initializePhetioObject - The wrapper instance for PhET-iO interoperation
    this.phetioWrapper = null;

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

      assert && assert( options.tandem, 'Component was missing its tandem' );
      assert && assert( options.tandem.phetioID, 'Component was missing its phetioID' );

      if ( assert && options.phetioType && PHET_IO_ENABLED ) {
        assert && assert( options.phetioType.documentation, 'There must be a documentation string for each IO Type.' );

        for ( var methodName in options.phetioType.methods ) {
          var method = options.phetioType.methods[ methodName ];

          if ( typeof method === 'function' ) {

            // This is a private function for internal phet-io mechanics, not for exporting over the API, so it doesn't
            // need to be checked.
          }
          else {
            var IOType = options.phetioType;

            // If you get one of these assertion errors, go to the IOType definition file and check its methods
            assert && assert( !!method.returnType, IOType.typeName + '.' + methodName + ' needs a returnType' );
            assert && assert( !!method.implementation, IOType.typeName + '.' + methodName + ' needs an implementation function' );
            assert && assert( !!method.parameterTypes, IOType.typeName + '.' + methodName + ' needs a parameterTypes array' );
            assert && assert( !!method.documentation, IOType.typeName + '.' + methodName + ' needs a documentation string' );
          }
        }

        assert && assert( options.phetioType !== undefined, options.tandem.phetioID + ' missing type from phetio.api' );
        assert && assert( options.phetioType.typeName, 'no type name for ' + options.tandem.phetioID + '(may be missing type parameter)' );
        assert && assert( options.phetioType.typeName, 'type must be specified and have a typeName for ' + options.tandem.phetioID );
      }

      if ( options.phetioInstanceDocumentation && options.phetioInstanceDocumentation.length > 0 ) {
        assert && assert( _.endsWith( options.phetioInstanceDocumentation, '.' ), 'phetioInstanceDocumentation should end with a \'.\': ' + options.phetioInstanceDocumentation );
      }

      options = _.extend( {}, DEFAULTS, baseOptions, options );

      // Unpack options to instance properties
      this.tandem = options.tandem;
      this.phetioType = options.phetioType;
      this.phetioState = options.phetioState;
      this.phetioReadOnly = options.phetioReadOnly;
      this.phetioInstanceDocumentation = options.phetioInstanceDocumentation;

      // Instantiate the wrapper instance which is used for PhET-iO communication
      if ( PHET_IO_ENABLED && this.tandem.enabled && this.tandem.supplied ) {
        this.phetioWrapper = new this.phetioType( this, this.tandem.phetioID );
      }

      // Register with the tandem registry
      this.tandem.addInstance( this );

      this.phetioObjectInitialized = true;
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
        this.phetioMessageIndex = SKIPPING_HIGH_FREQUENCY_MESSAGE;
        return;
      }

      if ( this.tandem.isSuppliedAndEnabled() ) {
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

      // The message was started as a high frequency event to be skipped, so the end is a no-op
      if ( this.phetioMessageIndex === SKIPPING_HIGH_FREQUENCY_MESSAGE ) {
        this.phetioMessageIndex = null;
        return;
      }

      if ( this.tandem.isSuppliedAndEnabled() ) {
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
        this.tandem.removeInstance( this );
      }

      this.phetioObjectDisposed = true;
    }
  } );
} );