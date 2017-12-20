// Copyright 2017, University of Colorado Boulder

/**
 * Base type for instrumented PhET-io instances, provides support for PhET-iO features when running with PhET-iO enabled.
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
    phetioEvents: true,             // When true, includes events in the PhET-iO events stream
    phetioReadOnly: false,          // When true, you can only get values from the instance; no setting allowed.
    phetioInstanceDocumentation: '' // Useful notes about an instrumented instance, shown in instance-proxies
  };

  var OPTIONS_KEYS = _.keys( DEFAULTS );

  /**
   * @param {Object} [options]
   * @constructor
   */
  function PhetioObject( options ) {

    // @protected {boolean} - true if an event is in progress
    this.eventInProgress = false;

    // @private
    this.initialized = false;

    // @private {number|boolean|null} - tracks the index of the message to make sure ends match starts.
    // If the tandem is not legal and usable, then returns false.
    // If the tandem is legal and usable, it returns a numeric identifier that is
    // used to cross-check the endEvent call (to make sure starts and ends match).
    // Null if an event is not in progress
    this.eventID = null;

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
      assert && assert( !this.initialized, 'cannot initialize twice' );
      this.initialized = true;

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
     * @public
     */
    startEvent: function( eventType, event, args ) {
      // assert && assert( !this.eventInProgress, 'cannot start event while event is in progress' );
      this.eventInProgress = true;
      var id = this.phetioObjectTandem.id;
      var index = this.phetioObjectTandem.isLegalAndUsable() && phetioEvents.start( eventType, id, this.phetioType, event, args );
      this.eventID = index;
    },

    /**
     * End an event on the nested PhET-iO event stream.
     * @public
     */
    endEvent: function() {
      // assert && assert( this.eventInProgress, 'cannot end an event that hasn\'t started' );
      this.phetioObjectTandem.isLegalAndUsable() && phetioEvents.end( this.eventID );
      this.eventInProgress = false;
      this.eventID = null;
    },

    /**
     * Unregisters from tandem when longer used.
     * @public
     */
    dispose: function() {
      //TODO enable this assertion when https://github.com/phetsims/equality-explorer/issues/25 is resolved
      assert && assert( !this.eventInProgress, 'cannot dispose while event is in progress' );

      // OK to dispose something that was never initialized, this means it was an uninstrumented instance
      if ( this.initialized ) {

        // Tandem de-registration
        this.phetioObjectTandem.removeInstance( this );
      }
    }
  } );
} );